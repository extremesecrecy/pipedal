/*
 *   Copyright (c) 2025 Robin E. R. Davies
 *   All rights reserved.

 *   Permission is hereby granted, free of charge, to any person obtaining a copy
 *   of this software and associated documentation files (the "Software"), to deal
 *   in the Software without restriction, including without limitation the rights
 *   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *   copies of the Software, and to permit persons to whom the Software is
 *   furnished to do so, subject to the following conditions:
 
 *   The above copyright notice and this permission notice shall be included in all
 *   copies or substantial portions of the Software.
 
 *   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *   SOFTWARE.
 */

import { useState, useEffect } from 'react';

const getSize = () => {
    return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
    };
};

export interface WindowSize {
    width: number;
    height: number;
}
export default function useWindowSize() {

    const [size, setSize] = useState<WindowSize>(getSize());

    useEffect(() => {
        let mounted = true;
        let handleResizeT = () => {
            let pendingCallback = false;
            if (!pendingCallback) {
                window.requestAnimationFrame(() => {
                    if (mounted) {
                        setSize(getSize());
                        pendingCallback = false;
                    }
                });
                pendingCallback = true;
            }
        }
        window.addEventListener('resize', handleResizeT);
        return () => {
            mounted = false;
            window.removeEventListener('resize', handleResizeT);
        };
    }, []);

    return [size];
}