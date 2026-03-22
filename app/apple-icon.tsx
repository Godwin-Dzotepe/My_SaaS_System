import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2550d7',
          borderRadius: 40,
          fontFamily: 'Arial',
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2550d7',
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: -1,
          }}
        >
          FL
        </div>
      </div>
    ),
    size
  );
}
