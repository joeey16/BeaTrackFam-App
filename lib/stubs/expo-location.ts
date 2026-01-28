type PermissionResponse = {
  status: "granted" | "denied" | "undetermined";
  granted?: boolean;
  canAskAgain?: boolean;
  expires?: "never";
};

export async function getForegroundPermissionsAsync(): Promise<PermissionResponse> {
  return { status: "denied", granted: false, canAskAgain: false, expires: "never" };
}

export async function requestForegroundPermissionsAsync(): Promise<PermissionResponse> {
  return { status: "denied", granted: false, canAskAgain: false, expires: "never" };
}
