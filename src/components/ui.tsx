import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

export function Label({ children, style }: React.PropsWithChildren<{ style?: any }>) { return <Text style={[styles.label, style]}>{children}</Text>; }
export function Button({ title, onPress, variant = 'primary', loading, disabled, style }: { title: string; onPress: () => void; variant?: 'primary' | 'soft' | 'plain'; loading?: boolean; disabled?: boolean; style?: ViewStyle }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.button, variant === 'primary' ? styles.primary : variant === 'soft' ? styles.soft : styles.plain, (disabled || loading) && { opacity: .6 }, pressed && { opacity: .85 }, style]}>{loading ? <ActivityIndicator color={variant === 'primary' ? 'white' : colors.green} /> : <Text style={[styles.buttonText, variant !== 'primary' && { color: colors.green }]}>{title}</Text>}</Pressable>;
}
export function Field({ label, error, ...props }: TextInputProps & { label?: string; error?: string }) {
  return <View style={{ gap: 8 }}>{label ? <Label>{label}</Label> : null}<TextInput placeholderTextColor={colors.faint} {...props} style={[styles.field, props.style as any]} accessibilityLabel={props.accessibilityLabel || label} />{error ? <Text style={styles.error}>{error}</Text> : null}</View>;
}
export function Card({ children, style }: React.PropsWithChildren<{ style?: ViewStyle }>) { return <View style={[styles.card, style]}>{children}</View>; }
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) { return <View style={styles.row}><Text style={styles.section}>{title}</Text>{action ? <Pressable onPress={onAction}><Text style={styles.link}>{action}</Text></Pressable> : null}</View>; }

const styles = StyleSheet.create({ label: { color: colors.ink, fontSize: 13, fontWeight: '700' }, button: { minHeight: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, primary: { backgroundColor: colors.green }, soft: { backgroundColor: colors.greenSoft }, plain: { backgroundColor: 'transparent' }, buttonText: { color: 'white', fontSize: 15, fontWeight: '700' }, field: { minHeight: 54, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 16, color: colors.ink, fontSize: 15 }, card: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, section: { color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -.3 }, link: { color: colors.green, fontWeight: '700', fontSize: 13 }, error: { color: colors.red, fontSize: 13, lineHeight: 19 } });
