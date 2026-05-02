import { AccessToken } from 'livekit-server-sdk';

/** JWT for joining a consultation room (`roomName` convention: `consultation:<uuid>`). */
export async function mintLiveKitConsultationToken(opts: {
  apiKey: string;
  apiSecret: string;
  roomName: string;
  participantIdentity: string;
  participantName: string;
}): Promise<string> {
  const token = new AccessToken(opts.apiKey, opts.apiSecret, {
    identity: opts.participantIdentity,
    name: opts.participantName,
  });
  token.addGrant({
    room: opts.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  return await token.toJwt();
}
