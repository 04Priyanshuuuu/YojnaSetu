import * as Linking from "expo-linking";

export const openExternalUrl = async (url?: string | null) => {
  if (!url) return false;
  const supported = await Linking.canOpenURL(url);
  if (!supported) return false;
  await Linking.openURL(url);
  return true;
};

export const createAppUrl = (path: string) => Linking.createURL(path);
