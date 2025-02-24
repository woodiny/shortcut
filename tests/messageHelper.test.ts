import { MessageType, IMessagePayload } from '../src/utils/messageHelper';

describe('Message Payload', () => {
  it('should have a valid type', () => {
    const msg: IMessagePayload = {
      type: MessageType.GREETING,
      payload: 'Hello'
    };
    expect(msg.type).toBe(MessageType.GREETING);
    expect(msg.payload).toBe('Hello');
  });
});
