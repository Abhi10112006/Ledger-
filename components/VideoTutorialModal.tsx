import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const VideoTutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const MOCK_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <button
          onClick={onClose}
          style={{
            alignSelf: 'flex-end',
            marginBottom: 12,
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: 9999,
            padding: '8px 14px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span>Done</span>
          <X size={15} />
        </button>

        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            background: '#1C1C1E',
            borderRadius: 24,
            overflow: 'hidden',
            border: '0.5px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            position: 'relative',
          }}
        >
          <video
            src={MOCK_VIDEO_URL}
            controls
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              padding: '4px 10px',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: 9999,
              border: '0.5px solid rgba(255, 255, 255, 0.15)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            Video Walkthrough
          </div>
        </div>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Ledger Walkthrough
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'rgba(235, 235, 245, 0.55)' }}>
            Learn how to record loans, track repayments, and manage contacts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VideoTutorialModal;
