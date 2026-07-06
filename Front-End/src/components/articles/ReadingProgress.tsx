import { useState, useEffect } from 'react';

interface ReadingProgressProps {
    targetRef?: React.RefObject<HTMLElement>;
}

const ReadingProgress = ({ targetRef }: ReadingProgressProps) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            let scrollHeight: number;
            let clientHeight: number;
            let scrollTop: number;

            if (targetRef?.current) {
                scrollHeight = targetRef.current.scrollHeight;
                clientHeight = targetRef.current.clientHeight;
                scrollTop = targetRef.current.scrollTop;
            } else {
                scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                scrollTop = window.scrollY;
                clientHeight = 0;
            }

            const totalHeight = scrollHeight - clientHeight;
            const progressPercentage = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;

            setProgress(Math.min(100, Math.max(0, progressPercentage)));
        };

        const target = targetRef?.current || window;
        target.addEventListener('scroll', updateProgress);
        updateProgress();

        return () => target.removeEventListener('scroll', updateProgress);
    }, [targetRef]);

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
            <div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

export default ReadingProgress;
