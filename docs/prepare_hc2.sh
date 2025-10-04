#!/bin/bash

# Configuration
SDCARD="/dev/disk4"  # Change this to the correct SD card device
URL="https://de.eu.odroid.in/ubuntu_24.04lts/XU3_XU4_MC1_HC1_HC2"
FILENAME="ubuntu-24.04-6.6-minimal-odroid-xu4-20240911.img.xz"

# Step 1: Get the Official Ubuntu Image
echo "Downloading the official Ubuntu image..."
if wget -c "$URL/$FILENAME"; then
    echo "Download completed successfully."
else
    echo "Error: Failed to download the image file!"
    exit 1
fi

# Step 2: Flash to SD Card
echo "Flashing the image to $SDCARD..."
if xzcat "$FILENAME" | sudo dd of="$SDCARD" bs=4M status=progress; then
    sync
    echo "Flashing complete. Remove the SD card and insert it into your embedded system."
else
    echo "Error: Failed to flash the image to $SDCARD!"
    exit 1
fi
