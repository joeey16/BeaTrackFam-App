import * as Facebook from "expo-auth-session/providers/facebook";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";

type SocialUserInfo = {
  email: string;
  name?: string;
  avatar?: string;
};

export const GOOGLE_CLIENT_IDS = {
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
  expo: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? "",
};

export const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? "";

export function useGoogleAuth() {
  const [userInfo, setUserInfo] = useState<SocialUserInfo | null>(null);

  const [_request, response, promptAsync] = Google.useAuthRequest({
    // Add these platform-specific keys
    iosClientId: GOOGLE_CLIENT_IDS.ios || "MISSING_GOOGLE_IOS_CLIENT_ID",
    androidClientId: GOOGLE_CLIENT_IDS.android || "MISSING_GOOGLE_ANDROID_CLIENT_ID",
    expoClientId: GOOGLE_CLIENT_IDS.expo || "MISSING_GOOGLE_EXPO_CLIENT_ID",
    // Keep this for Web/Expo Go testing
    webClientId: GOOGLE_CLIENT_IDS.web || "MISSING_GOOGLE_WEB_CLIENT_ID",
  });

  // ... rest of your code

  useEffect(() => {
    async function handleResponse() {
      if (response?.type === "success") {
        const token = response.authentication?.accessToken;
        if (!token) return;

        const user = await fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json());

        setUserInfo({
          email: user.email,
          name: user.name,
        });
      }
    }
    handleResponse();
  }, [response]);

  return { promptAsync, userInfo };
}

export function useFacebookAuth() {
  const [userInfo, setUserInfo] = useState<SocialUserInfo | null>(null);

  const [_request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID || "MISSING_FACEBOOK_APP_ID",
    responseType: "token",
    scopes: ["public_profile", "email"],
  });

  useEffect(() => {
    async function handleResponse() {
      if (response?.type === "success") {
        const token = response.authentication?.accessToken;
        if (!token) return;

        const user = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
        ).then((res) => res.json());

        setUserInfo({
          email: user.email,
          name: user.name,
          avatar: user.picture?.data?.url,
        });
      }
    }
    handleResponse();
  }, [response]);

  return { promptAsync, userInfo };
}

export async function loginWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  return {
    email: credential.email,
    name: credential.fullName?.givenName,
  };
}
