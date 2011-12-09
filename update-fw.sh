#!/bin/bash

FW_PATH="$1"

if test "x${FW_PATH}x" = "xx"; then
    echo "Usage: " $(basename $0) "/path/to/web-ui-fw"
    exit 1
fi

cp -r ${FW_PATH}/demos/gallery/* . 2>/dev/null
cp -r ${FW_PATH}/build/web-ui-fw/latest/* web-ui-fw
