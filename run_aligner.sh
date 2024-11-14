#!/bin/bash

DORADO_PATH="/home/dglubokov/dorado-0.8.2-linux-x64/bin/dorado"
INDEX_PATH="/home/dglubokov/jb0158__consensus_ighv4-39_igkv3-15.mmi"

OUTPUT_DIR="/home/dglubokov/aligner_output"
mkdir -p "$OUTPUT_DIR"

BASECALL_CMD="$DORADO_PATH aligner \
    $INDEX_PATH \
    "/home/dglubokov/basecalled_data_v2/" \
    --output-dir "$OUTPUT_DIR"
"

# Run the basecalling command
$BASECALL_CMD
