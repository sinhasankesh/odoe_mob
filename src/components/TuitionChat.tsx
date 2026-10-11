import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { tuitionRequest, TuitionRole } from '@/api/tuition';
import { mobile } from '@/components/mobile';

type Row = Record<string, any>;
const listOf=(value:any):Row[]=>Array.isArray(value)?value:value?.conversations||value?.messages||value?.rows||value?.items||value?.requests||value?.data||[];
const idOf=(item:Row)=>item?.conversation_id??item?.chat_id??item?.id;
const dateOf=(value:any)=>{if(!value)return '';const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});};
const initials=(value:any)=>String(value||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'?';

export default function TuitionChat({role,userId}:{role:TuitionRole;userId?:string|number}){
 const [chats,setChats]=useState<Row[]>([]),[active,setActive]=useState<Row|null>(null),[messages,setMessages]=useState<Row[]>([]),[requests,setRequests]=useState<Row[]>([]),[choice,setChoice]=useState(''),[draft,setDraft]=useState(''),[attachment,setAttachment]=useState(''),[attachOpen,setAttachOpen]=useState(false),[newOpen,setNewOpen]=useState(false),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[error,setError]=useState('');
 const scroll=useRef<ScrollView>(null);const isStudent=role==='student';const openId=active?idOf(active):null;const {width,height}=useWindowDimensions();const narrow=width<700;
 const readChats=useCallback(async()=>{try{const result=await tuitionRequest(role,'/chats');setChats(listOf(result));}catch(e:any){setError(e.message||'Could not load conversations.');}finally{setLoading(false);}},[role]);
 const readThread=useCallback(async(chat:Row,markRead=true)=>{const id=idOf(chat);if(id==null)return;try{const result=await tuitionRequest(role,`/chats/${id}/messages`);setMessages(listOf(result));if(markRead){await tuitionRequest(role,`/chats/${id}/read`,{method:'PATCH'});setChats(current=>current.map(c=>String(idOf(c))===String(id)?{...c,unread_count:0}:c));}}catch(e:any){setError(e.message||'Could not load messages.');}},[role]);
 useEffect(()=>{readChats();const poll=setInterval(readChats,20000);return()=>clearInterval(poll);},[readChats]);
 useEffect(()=>{if(!active)return;readThread(active);const poll=setInterval(()=>readThread(active,false),5000);return()=>clearInterval(poll);},[active,readThread]);
 useEffect(()=>{if(!newOpen)return;let mounted=true;(async()=>{try{const result=isStudent?await tuitionRequest('student','/requests'):await tuitionRequest('teacher','/assignments',{}, {status:'accepted'});if(mounted){const options=listOf(result).filter(item=>isStudent?['active','accepted'].includes(String(item.status||'').toLowerCase()):['active','accepted'].includes(String(item.status||'').toLowerCase()));setRequests(options);setChoice(current=>options.some(item=>String(item.assignment_id??item.request_id??item.id)===current)?current:String(options[0]?.assignment_id??options[0]?.request_id??options[0]?.id??''));}}catch(e:any){if(mounted)setError(e.message||'Could not load active tuition requests.');}})();return()=>{mounted=false;};},[newOpen,isStudent]);
 useEffect(()=>{if(messages.length)requestAnimationFrame(()=>scroll.current?.scrollToEnd({animated:true}));},[messages.length,openId]);
 async function openChat(chat:Row){setActive(chat);setMessages([]);setError('');}
 async function startChat(){const chosen=requests.find(item=>String(item.assignment_id??item.request_id??item.id)===choice);if(!chosen){setError('An active tuition request is required to start a conversation.');return;}if(!draft.trim()){setError('Write your first message to start the conversation.');return;}setSending(true);setError('');try{const assignmentId=chosen.assignment_id??chosen.tuition_assignment_id??chosen.id;const studentId=chosen.student_id??(isStudent?userId:undefined);const created=await tuitionRequest(role,'/chats',{method:'POST',body:JSON.stringify({assignment_id:assignmentId,student_id:studentId,subject:chosen.subjects_needed||chosen.subject||'Tuition',message:draft.trim()})});setNewOpen(false);setDraft('');await readChats();const chat=created?.conversation||created?.chat||created; if(idOf(chat)!=null){setActive(chat);setMessages([]);}else{const refreshed=await tuitionRequest(role,'/chats');const next=listOf(refreshed);setChats(next);if(next[0])setActive(next[0]);}}catch(e:any){setError(e.message||'Could not start conversation.');}finally{setSending(false);}}
 async function sendMessage(){const body=draft.trim();const link=attachment.trim();if((!body&&!link)||!active||sending)return;setSending(true);setError('');try{const id=idOf(active);await tuitionRequest(role,`/chats/${id}/messages`,{method:'POST',body:JSON.stringify({message:body,message_type:link?'document':'text',attachment_url:link||null})});setDraft('');setAttachment('');await readThread(active,false);await readChats();}catch(e:any){setError(e.message||'Message could not be sent.');}finally{setSending(false);}}
 async function toggleStatus(){if(!active)return;const status=String(active.status).toLowerCase()==='resolved'?'open':'resolved';setError('');try{await tuitionRequest(role,`/chats/${idOf(active)}/status`,{method:'PATCH',body:JSON.stringify({status})});setActive({...active,status});await readChats();}catch(e:any){setError(e.message||'Conversation status could not be changed.');}}
 const selectedTitle=isStudent?(active?.teacher_name||active?.tutor_name||'Your teacher'):(active?.student_name||'Student');
 const otherRole=isStudent?'teacher':'student';
 return <KeyboardAvoidingView style={[chat.page,{height:Math.min(780,Math.max(470,height-270))}]} behavior={Platform.OS==='ios'?'padding':undefined}>
  <View style={chat.layout}>
   {(!narrow||!active)?<View style={[chat.sidebar,narrow&&chat.sidebarFull]}>
    <View style={chat.sidebarHeader}><View style={{flex:1}}><Text style={chat.sidebarEyebrow}>DOUBT SUPPORT</Text><Text style={chat.sidebarHeading}>{isStudent?'Teacher conversations':'Learner conversations'}</Text></View><Pressable accessibilityRole="button" onPress={()=>{setDraft('');setError('');setNewOpen(v=>!v);}} style={chat.newButton}><Text style={chat.newButtonText}>{newOpen?'×':'＋'} {newOpen?'Close':'New'}</Text></Pressable></View>
    {newOpen?<View style={chat.newPanel}><Text style={chat.eyebrow}>{isStudent?'START A DOUBT':'START A CONVERSATION'}</Text><Text style={chat.label}>{isStudent?'Choose your request':'Choose a learner'}</Text>{requests.length?<Picker selectedValue={choice} onValueChange={value=>setChoice(String(value))} style={chat.picker}>{requests.map(item=>{const id=item.assignment_id??item.request_id??item.id;return <Picker.Item key={String(id)} label={`${item.student_name||item.subjects_needed||item.subject||'Tuition'} · ${item.student_class||item.status}`} value={String(id)}/>;})}</Picker>:<Text style={chat.hint}>No active tuition requests are available yet.</Text>}<TextInput value={draft} onChangeText={setDraft} placeholder="Write your first message…" placeholderTextColor="#71869D" multiline style={chat.newInput}/><Pressable accessibilityRole="button" disabled={sending||!requests.length} onPress={startChat} style={[chat.primary,sending&&chat.disabled]}><Text style={chat.primaryText}>{sending?'Starting…':'Start conversation'}</Text></Pressable></View>:null}
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{gap:8,paddingVertical:8}}>{loading?<ActivityIndicator color="#087E91"/>:chats.map((item,index)=>{const selected=String(idOf(item))===String(openId);const name=isStudent?(item.teacher_name||item.tutor_name||'Teacher'):(item.student_name||'Student');return <Pressable key={String(idOf(item)??index)} accessibilityRole="button" accessibilityState={{selected}} onPress={()=>openChat(item)} style={[chat.chatRow,selected&&chat.chatSelected]}><View style={[chat.avatar,chat.avatarColors[index%chat.avatarColors.length]]}><Text style={chat.avatarText}>{initials(name)}</Text></View><View style={{flex:1,minWidth:0,gap:3}}><Text numberOfLines={1} style={chat.chatTitle}>{item.subject||name}</Text><Text numberOfLines={1} style={chat.chatPreview}>{item.last_message||'Open conversation'}</Text><Text style={chat.chatTime}>{dateOf(item.last_message_at||item.updated_at)}</Text></View>{Number(item.unread_count)>0?<View style={chat.unread}><Text style={chat.unreadText}>{item.unread_count}</Text></View>:null}</Pressable>;})}{!loading&&!chats.length&&!newOpen?<Text style={chat.hint}>No conversations yet. Start one when a tuition request is active.</Text>:null}</ScrollView>
   </View>:null}
   {(!narrow||!!active)?<View style={[chat.conversation,!active&&chat.conversationEmpty]}>
    {active?<><View style={chat.header}><View style={chat.avatar}><Text style={chat.avatarText}>{initials(selectedTitle)}</Text></View><View style={{flex:1,minWidth:0}}><Text style={chat.subject}>{active.subject||'Tuition'}</Text><Text numberOfLines={1} style={chat.headerName}>{selectedTitle}</Text><Text style={chat.presence}>{otherRole==='teacher'?'Tuition teacher':'Tuition student'}{active.student_class?` · ${active.student_class}`:''}</Text></View><Pressable accessibilityRole="button" onPress={toggleStatus} style={[chat.status,String(active.status).toLowerCase()==='resolved'&&chat.statusResolved]}><Text style={chat.statusText}>{active.status==='resolved'?'REOPEN':'RESOLVE'}</Text></Pressable>{narrow?<Pressable accessibilityRole="button" onPress={()=>setActive(null)} style={chat.backButton}><Text style={chat.backText}>Back</Text></Pressable>:null}</View>
     <ScrollView ref={scroll} style={chat.messageList} contentContainerStyle={chat.messageContent} keyboardShouldPersistTaps="handled">{messages.map((item,index)=>{const mine=String(item.sender_role||'').toLowerCase()===role||String(item.sender_id??'')===String(userId??'');return <View key={String(item.message_id??item.id??index)} style={[chat.bubble, mine?chat.mine:chat.theirs]}><Text style={[chat.bubbleText,mine&&chat.mineText]}>{item.message||item.text||''}</Text>{item.attachment_url?<Pressable onPress={async()=>{try{await Linking.openURL(String(item.attachment_url));}catch{setError('This attachment link could not be opened.');}}}><Text style={[chat.attachmentText,mine&&chat.mineText]}>↗ {item.message_type==='document'?'Open attachment':'Open link'}</Text></Pressable>:null}<Text style={[chat.timestamp,mine&&chat.mineTime]}>{dateOf(item.created_at||item.sent_at)}{mine?'  ✓':''}</Text></View>;})}{!messages.length?<Text style={chat.hint}>No messages yet. Send a message to get started.</Text>:null}</ScrollView>
     {error?<Text accessibilityRole="alert" style={chat.error}>{error}</Text>:null}
     <View style={chat.composer}>{attachOpen?<TextInput accessibilityLabel="Attachment URL (optional)" value={attachment} onChangeText={setAttachment} placeholder="Paste a file or resource link" placeholderTextColor="#71869D" autoCapitalize="none" keyboardType="url" style={chat.linkInput}/>:null}<View style={chat.composerRow}><Pressable accessibilityRole="button" accessibilityLabel="Add attachment link" onPress={()=>setAttachOpen(v=>!v)} style={[chat.attachButton,attachOpen&&chat.attachActive]}><Text style={chat.attachText}>{attachOpen?'×':'＋'}</Text></Pressable><TextInput accessibilityLabel="Message" value={draft} onChangeText={setDraft} placeholder="Type your doubt or reply…" placeholderTextColor="#71869D" multiline maxLength={4000} style={chat.messageInput}/><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={sending||(!draft.trim()&&!attachment.trim())} onPress={sendMessage} style={[chat.sendButton,(sending||(!draft.trim()&&!attachment.trim()))&&chat.disabled]}><Text style={chat.sendText}>{sending?'…':'➤'}</Text></Pressable></View></View>
    </>:<View style={chat.welcome}><View style={chat.welcomeIcon}><Text style={chat.avatarText}>✉</Text></View><Text style={chat.heading}>Your tuition conversations</Text><Text style={chat.hint}>Select a conversation to read and reply. Messages refresh automatically while this screen is open.</Text></View>}
   </View>:null}
  </View>
  {error&&!active?<Text accessibilityRole="alert" style={chat.error}>{error}</Text>:null}
 </KeyboardAvoidingView>;
}

const chat:Record<string,any>={
 page:{height:640,minHeight:470,borderWidth:1,borderColor:'#BBD8D5',borderRadius:20,backgroundColor:'#EAF1EE',overflow:'hidden',shadowColor:'#113F43',shadowOpacity:.12,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:4} as const,
 layout:{flex:1,flexDirection:'row'} as const,
 sidebar:{width:285,borderRightWidth:1,borderRightColor:'#D7E4E1',padding:14,gap:10,backgroundColor:'#FCFEFD'} as const,
 sidebarFull:{width:'100%',borderRightWidth:0} as const,
 sidebarHeader:{flexDirection:'row',alignItems:'center',gap:9,padding:13,borderRadius:15,backgroundColor:'#087E78',shadowColor:'#087E78',shadowOpacity:.15,shadowRadius:8,shadowOffset:{width:0,height:4}} as const,
 eyebrow:{fontSize:10,fontWeight:'800',letterSpacing:1,color:'#60748B'} as const,
 heading:{fontSize:18,fontWeight:'800',color:'#19304A',marginTop:5} as const,
 sidebarHeading:{fontSize:16,fontWeight:'800',color:'#FFFFFF',marginTop:5} as const,
 sidebarEyebrow:{fontSize:9,fontWeight:'900',letterSpacing:1.2,color:'#B9F0E7'} as const,
 headerName:{fontSize:17,fontWeight:'900',color:'#FFFFFF',marginTop:3} as const,
 newButton:{paddingHorizontal:10,paddingVertical:10,backgroundColor:'#FFD28A',borderWidth:1,borderColor:'#F8BE62',borderRadius:11},
 newButtonText:{color:'#573B12',fontSize:12,fontWeight:'900'} as const,
 newPanel:{padding:13,gap:9,borderWidth:1,borderColor:'#C9DFDA',borderRadius:14,backgroundColor:'#F0F8F5',shadowColor:'#153D39',shadowOpacity:.06,shadowRadius:8,shadowOffset:{width:0,height:3}} as const,
 label:{fontSize:12,fontWeight:'700',color:'#344B64'} as const,
 picker:{backgroundColor:'#EDF3F8',color:'#243A54',height:50} as const,
 newInput:{minHeight:65,maxHeight:120,padding:11,borderRadius:10,borderWidth:1,borderColor:'#C8D8E6',backgroundColor:'#FFFFFF',color:'#243A54',textAlignVertical:'top'} as const,
 primary:{padding:12,borderRadius:10,backgroundColor:'#087E91',alignItems:'center'} as const,
 primaryText:{color:'#FFFFFF',fontWeight:'800',fontSize:12} as const,
 disabled:{opacity:.5} as const,
 hint:{color:'#71869D',fontSize:12,lineHeight:18,padding:12,textAlign:'center'} as const,
 chatRow:{minHeight:77,flexDirection:'row',alignItems:'center',gap:10,padding:10,borderWidth:1,borderColor:'transparent',borderRadius:14,backgroundColor:'#F3F7F5'} as const,
 chatSelected:{borderColor:'#087E78',backgroundColor:'#DDF4EF',shadowColor:'#087E78',shadowOpacity:.1,shadowRadius:7,shadowOffset:{width:0,height:3}} as const,
 avatar:{width:42,height:42,borderRadius:21,alignItems:'center',justifyContent:'center',backgroundColor:'#62D5E7'} as const,
 avatarColors:[{backgroundColor:'#90E0D2'},{backgroundColor:'#FFD28A'},{backgroundColor:'#D8C6FA'},{backgroundColor:'#F5B8C6'}] as const,
 avatarText:{fontSize:13,fontWeight:'800',color:'#16465A'} as const,
 chatTitle:{fontSize:13,fontWeight:'800',color:'#20364F'} as const,
 chatPreview:{fontSize:11,color:'#60748B'} as const,
 chatTime:{fontSize:10,fontWeight:'700',color:'#72869A'} as const,
 unread:{minWidth:20,height:20,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:'#087E91',paddingHorizontal:5} as const,
 unreadText:{fontSize:10,fontWeight:'800',color:'#FFFFFF'} as const,
 conversation:{flex:1,minWidth:0,backgroundColor:'#EFF4F0'} as const,
 conversationEmpty:{alignItems:'center',justifyContent:'center',padding:20} as const,
 header:{minHeight:78,paddingHorizontal:16,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#087E78',borderBottomWidth:1,borderBottomColor:'#076D67'} as const,
 subject:{fontSize:11,fontWeight:'800',color:'#B9F0E7'},
 presence:{fontSize:10,color:'#D0ECE8',marginTop:3},
 status:{paddingHorizontal:11,paddingVertical:9,borderRadius:20,backgroundColor:'#FFD28A'},
 statusResolved:{backgroundColor:'#B8E8CE'},
 statusText:{fontSize:9,fontWeight:'900',letterSpacing:.45,color:'#4C3818'},
 backButton:{padding:8},
 backText:{fontSize:12,fontWeight:'800',color:'#FFFFFF'},
 messageList:{flex:1},
 messageContent:{padding:16,gap:10,flexGrow:1,justifyContent:'flex-end'},
 bubble:{maxWidth:'84%',paddingHorizontal:13,paddingVertical:10,borderRadius:16,gap:4,shadowColor:'#29433D',shadowOpacity:.07,shadowRadius:3,shadowOffset:{width:0,height:1},elevation:1},
 mine:{alignSelf:'flex-end',backgroundColor:'#D9FDD3',borderBottomRightRadius:5},
 theirs:{alignSelf:'flex-start',backgroundColor:'#FFFFFF',borderBottomLeftRadius:5},
 bubbleText:{fontSize:14,lineHeight:20,color:'#344B64'},
 mineText:{color:'#255C46'},
 attachmentText:{fontSize:12,fontWeight:'800',color:'#087E78',textDecorationLine:'underline',paddingTop:4},
 timestamp:{fontSize:9,fontWeight:'700',color:'#71869D',alignSelf:'flex-end'},
 mineTime:{color:'#4C8165'},
 composer:{paddingHorizontal:10,paddingVertical:10,borderTopWidth:1,borderTopColor:'#DCE7E2',backgroundColor:'#F8FBF9',gap:8},
 composerRow:{flexDirection:'row',alignItems:'flex-end',gap:7},
 attachButton:{width:40,height:44,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:'#E3EEE9'},
 attachActive:{backgroundColor:'#FFE5B4'},
 attachText:{fontSize:23,fontWeight:'700',color:'#087E78',lineHeight:28},
 messageInput:{flex:1,minWidth:0,minHeight:44,maxHeight:105,paddingHorizontal:13,paddingVertical:10,borderRadius:17,borderWidth:1,borderColor:'#D0DED8',backgroundColor:'#FFFFFF',color:'#243A54',textAlignVertical:'center'},
 linkInput:{width:'100%',minHeight:42,paddingHorizontal:12,borderRadius:12,borderWidth:1,borderColor:'#C9DFDA',backgroundColor:'#FFFFFF',color:'#243A54',fontSize:12},
 sendButton:{width:46,height:44,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'#087E78',shadowColor:'#075E54',shadowOpacity:.15,shadowRadius:5,shadowOffset:{width:0,height:2}},
 sendText:{fontSize:19,fontWeight:'900',color:'#FFFFFF'},
 error:{color:'#A22B3E',fontSize:12,padding:10},
 welcome:{alignItems:'center',gap:10,maxWidth:300},
 welcomeIcon:{width:54,height:54,borderRadius:27,alignItems:'center',justifyContent:'center',backgroundColor:'#DDF3F7'},
};
