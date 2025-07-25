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

import React from 'react';
import IconButton, {IconButtonProps} from '@mui/material/IconButton';
import ToolTipEx from './ToolTipEx';
import Typography from "@mui/material/Typography";

interface IconButtonExProps extends IconButtonProps {
    tooltip: React.ReactElement | string;
    style?: React.CSSProperties;
};

function IconButtonEx(props: IconButtonExProps) {
    const { tooltip,style, ...extra   } = props;
    
    return (
        <ToolTipEx title={
            (typeof props.tooltip === 'string') ?
            (
                <Typography variant="caption">{tooltip || extra['aria-label'] }</Typography>
            ): (props.tooltip as React.ReactElement)
        }
        >   
            <IconButton {...extra} style={style}  />
        </ToolTipEx>
    );
}

export default IconButtonEx;