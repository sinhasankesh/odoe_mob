# Odoe Mobile

Fresh React Native app built with Expo Router and TypeScript. The first pass focuses on the student experience and CUET university discovery, with the API client ready for the existing Odoe backend.

## Start the app

1. Install Node.js 20.19+.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the reachable backend origin. For a physical phone, use your computer's LAN IP rather than `localhost`.
3. Optionally set `EXPO_PUBLIC_CUET_EXAM_TYPE_ID` to the CUET exam directory ID for your environment. If unset, the app resolves a unique CUET match from `/api/auth/exam-types` and the authenticated CUET API enforces the student's account mapping.
4. Run `npm install`, then `npm start`. Open the QR code in Expo Go or run `npm run ios` / `npm run android`.

## What's included

- Home, My learning, Explore and Profile tabs. Explore brings the Odoe platform’s CUET, courses/test series, one-to-one tuition, school workspace, learning games, learner benefits, student stories, updates and insights into a mobile-first discovery surface.
- Email/password login against `/api/auth/login`; JWT is stored using platform secure storage and sent through one API client.
- CUET year, degree, programme and university selection against `/api/student/cuet/*`, preserving published eligibility text and source-verification metadata.
- Course detail and topic listing surfaces.
- Dedicated mobile information pages for tuition and school partnerships.
- Role fields are retained in the user model for future teacher/school-specific navigation. The initial shell is student-first.

## API and security notes

- The API base URL is environment-specific. Never commit production credentials or tokens.
- The current backend issues a one-hour JWT and has no refresh route. A 401 clears the stored token; the student signs in again.
- Only routes documented as user-safe are wired into student actions. Legacy payment and content-writing endpoints are intentionally not exposed in the app.
- Catalogue records are never fabricated. CUET empty, loading, and failure states are shown without invented admissions requirements.
- Some catalogue responses may not return all CUET fields in the same shape as the reference; adjust endpoint adapters in `src/api/cuet.ts` when integrating the deployed backend.

## Suggested next phases

1. Confirm backend origin, CUET exam mapping and response envelopes in staging; add OTP registration and password reset.
2. Add practice tests, result review, performance, notifications and offline-safe reading based on secured student endpoints.
3. Add teacher application and approved-teacher workspace screens, then school/parent surfaces based on tenant context.
4. Complete accessibility audits, device QA, crash reporting, analytics consent, app icons/splash and store release setup.

## Production definition of done

- Staging and production API environments are verified on physical iOS and Android devices.
- Login, expiry, no-network, retry and role/tenant denial paths are checked end to end.
- Pagination, filtering and stale-request behavior have been validated with large CUET catalogues.
- Dynamic text, screen readers, contrast, keyboard navigation and touch targets are reviewed.
- Privacy policy, data retention, secure logging, monitoring, crash reporting, app signing and store metadata are complete.

## Mobile account and workspaces

Profile includes native profile/password forms, invoices, course subscriptions, and consultation history. Tuition includes native tutor requests and student lists; School includes native memberships and applications. Advanced tuition and school management and checkout use the existing web application's responsive pages inside an embedded WebView, not separate native implementations. On native devices, the app session is seeded only on the configured Odoe web origin in a private WebView; web preview may require a separate sign-in inside the frame. No tokens are placed in URLs. Refresh course access after payment.

Set both `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` to hosts reachable from the device. `localhost` works on the development computer but points to the phone itself on physical devices. Restart Expo after changing environment values. Production endpoints should use HTTPS; embedding also requires the web server's frame policy to permit the preview host. Payment-provider embedded-browser support must be tested before release.

Study resources use `/viewer`: YouTube is embedded, videos use an inline player, and PDFs render through locally bundled PDF.js with paging and zoom. Run `npm run bundle:pdf` after upgrading `pdfjs-dist`. No document is sent to a third-party PDF viewer. Unsupported document formats need server conversion to PDF for consistent mobile viewing. Protected PDF fetches attach authorization only to the configured API origin. Cross-origin web preview documents must permit CORS.

Verification in this update: TypeScript, production web bundle, and a synthetic PDF rendered at a 390px viewport. Real credentials, financial transactions, physical-device playback, and role-specific school/tuition operations remain release checks.
