import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};

export const contentType = 'image/png';

export default function Icon() {
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
          borderRadius: 96,
          position: 'relative',
          fontFamily: 'Arial',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 76,
            borderRadius: 80,
            background: 'rgba(255,255,255,0.12)',
          }}
        />
        <div
          style={{
            width: 208,
            height: 208,
            borderRadius: 48,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2550d7',
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          FL
        </div>
      </div>
    ),
    size
  );
}
