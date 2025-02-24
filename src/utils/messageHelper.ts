export enum MessageType {
  GREETING = "GREETING",
  DATA_REQUEST = "DATA_REQUEST",
  DATA_RESPONSE = "DATA_RESPONSE"
}

export interface IMessagePayload {
  type: MessageType;
  payload?: any;
}

export function addMessageListener(listener: (msg: IMessagePayload, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => void): void {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type) {
      listener(msg, sender, sendResponse);
    }
  });
}

export function sendMessage(message: IMessagePayload): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(response);
    });
  });
}
