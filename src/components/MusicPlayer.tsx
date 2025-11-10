import React, { useState, useEffect, useRef, useCallback } from 'react';

interface MusicPlayerProps {
    title: string;
    audioSrc?: string;
    coverArtUrl?: string;
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({
    title,
    audioSrc,
    coverArtUrl,
}) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(0);

    const setupAudioContext = useCallback(() => {
        if (!audioRef.current || analyserRef.current) return;
        const audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        const source = audioContext.createMediaElementSource(audioRef.current);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyserRef.current = analyser;
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (!analyserRef.current) {
            setupAudioContext();
        }
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current
                .play()
                .catch((e) => console.error('Playback failed:', e));
        }
        setIsPlaying(!isPlaying);
    };

    const drawVisualizer = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        if (!ctx) return;

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;
        let totalVolume = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] * (canvas.height / 255);
            totalVolume += dataArray[i];

            if (Math.random() > 0.995) {
                barHeight = canvas.height * 0.9;
            }

            const r = 50 + barHeight;
            const g = 255 - barHeight;
            const b = 150;
            ctx.fillStyle = `rgb(${r},${g},${b})`;

            if (Math.random() > 0.05) {
                ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            }

            x += barWidth + 1;
        }

        setVolume(totalVolume / bufferLength);

        animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    }, []);

    useEffect(() => {
        if (isPlaying) {
            animationFrameRef.current = requestAnimationFrame(drawVisualizer);
        } else {
            cancelAnimationFrame(animationFrameRef.current);
        }
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [isPlaying, drawVisualizer]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (audio.duration > 0) {
                setProgress((audio.currentTime / audio.duration) * 100);
                setCurrentTime(audio.currentTime);
            }
        };
        const setAudioDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', setAudioDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', setAudioDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60)
            .toString()
            .padStart(2, '0');
        return isNaN(minutes) ? '0:00' : `${minutes}:${seconds}`;
    };

    const coverArtStyle: React.CSSProperties = {
        filter: `
            saturate(${1 + volume / 50}) 
            contrast(${1 + volume / 100}) 
            hue-rotate(${volume * 2}deg)
            blur(${volume > 80 ? (volume - 80) / 20 : 0}px)
        `,
        transform: `
            scale(${1 + volume / 3000}) 
            skewX(${(Math.random() - 0.5) * (volume / 20)}deg)
        `,
        transition: 'filter 0.1s ease-out, transform 0.1s ease-out',
    };

    return (
        <div className="music-player">
            <audio ref={audioRef} src={audioSrc} preload="metadata"></audio>

            <div className="cover-art-container sunken-panel">
                {coverArtUrl && (
                    <img src={coverArtUrl} alt={title} style={coverArtStyle} />
                )}
                <div
                    className="static-overlay"
                    style={{ opacity: 0.05 + volume / 500 }}
                />
            </div>

            <div className="info-section">
                <div className="track-title" title={title}>
                    {title}
                </div>
                <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            <div className="progress-bar-container sunken-panel">
                <div
                    className="progress-bar"
                    style={{ width: `${progress}%` }}
                ></div>
                <div
                    className="progress-glitch"
                    style={{
                        left: `${Math.random() * 100}%`,
                        opacity: volume / 200,
                    }}
                />
            </div>

            <canvas
                ref={canvasRef}
                className="visualizer sunken-panel"
                width="280"
                height="80"
            ></canvas>

            <div className="controls field-row">
                <button onClick={togglePlay}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
            </div>
        </div>
    );
};

export default MusicPlayer;
