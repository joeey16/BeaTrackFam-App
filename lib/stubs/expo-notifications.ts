type PermissionResponse = {
  status: "granted" | "denied" | "undetermined";
  granted?: boolean;
  canAskAgain?: boolean;
  expires?: "never";
};

export async function getPermissionsAsync(): Promise<PermissionResponse> {
  return { status: "denied", granted: false, canAskAgain: false, expires: "never" };
}

export async function requestPermissionsAsync(): Promise<PermissionResponse> {
  return { status: "denied", granted: false, canAskAgain: false, expires: "never" };
}

export function addNotificationReceivedListener() {
  return { remove: () => {} };
}

export function addNotificationResponseReceivedListener() {
  return { remove: () => {} };
}

export function removeNotificationSubscription() {
  // no-op
}
