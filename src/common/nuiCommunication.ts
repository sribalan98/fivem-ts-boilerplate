/**
 * A simple wrapper around SendNUIMessage that you can use to
 * dispatch actions to the React frame.
 *
 * @param action - The action you wish to target
 * @param data - The data you wish to send along with this action
 * @param cd - The callback for sending the success message to React
 * @returns void
 */
export function sendNuiMessage<T>(action: string, data: T, cd?: () => void) {
  SendNUIMessage({
    action,
    data,
  });
}

/**
 * A wrapper around RegisterNuiCallback that provides type safety
 * for handling NUI callbacks from the React frame.
 *
 * @param action - The action to register the callback for
 * @param callback - The callback function to handle the NUI message
 * @returns void
 */
export function registerNuiCallback<T = any, R = any>(
  action: string,
  callback: (data: T, cb: (response: R) => void) => void
) {
  RegisterNuiCallback(action, callback);
}
