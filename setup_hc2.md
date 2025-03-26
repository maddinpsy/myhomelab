# update system
```bash
apt-get update
apt-get upgrade
```

# enable ssh connection, disable password connection
```bash
wget https://github.com/maddinpsy.keys -O- >> ~/.ssh/authorized_keys
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

# Mount main HDD
```bash
# Step 1: Identify the HDD (Modify this if needed)
DEVICE="/dev/sda1"  # Change this if your HDD is on a different device
MOUNT_POINT="/mnt/nfs_share"

# Step 2: Get the UUID of the HDD
UUID=$(blkid -s UUID -o value "$DEVICE")

# Check if UUID was found
if [ -z "$UUID" ]; then
    echo "Error: UUID not found for $DEVICE! Make sure the device exists."
    exit 1
fi

echo "Detected UUID: $UUID"

# Step 3: Formating Drive
echo "Formating Drive..."
sudo mkfs.ext4 /dev/sda1 -U $UUID

# Step 4: Create the mount point if it doesn't exist
if [ ! -d "$MOUNT_POINT" ]; then
    echo "Creating mount point at $MOUNT_POINT..."
    sudo mkdir -p "$MOUNT_POINT"
fi

# Step 5: Mount the HDD manually (for immediate use)
echo "Mounting HDD..."
sudo mount "$DEVICE" "$MOUNT_POINT"

# Step 6: Add the HDD to /etc/fstab for auto-mounting
FSTAB_ENTRY="UUID=$UUID $MOUNT_POINT ext4 defaults,nofail 0 2"

# Check if it's already in /etc/fstab
if ! grep -q "$UUID" /etc/fstab; then
    echo "Adding entry to /etc/fstab..."
    echo "$FSTAB_ENTRY" | sudo tee -a /etc/fstab
else
    echo "Entry already exists in /etc/fstab. Skipping."
fi

# Step 7: Reload fstab and verify
echo "Applying mount changes..."
sudo mount -a

echo "HDD setup complete! Mounted at $MOUNT_POINT and set to auto-mount on boot."
```

# install nfs server
```bash
apt install -y nfs-kernel-server
chmod 777 /mnt/nfs_share
echo "/mnt/nfs_share 192.168.0.0/24(rw,sync,no_subtree_check,no_root_squash)" >> /etc/exports
exportfs -ra
systemctl restart nfs-kernel-server
```
mount with
`sudo mount -o rw 192.168.0.238:/mnt/nfs_share /mnt/nfs_client`

# spin down hdd
```bash
sudo apt install -y hdparm
# test with
sudo hdparm -y /dev/sda
# set spindown after 5min
sudo hdparm -S 60 /dev/sda
```

# setup sync job
Mount second drive
```bash
apt install rsync
sudo apt install ntfs-3g -y
mkdir /mnt/backup
mount /dev/sdb1 /mnt/backup
# init the disk from the backup
rsync -av /mnt/backup/ /mnt/nfs_share/
# setup cron job to sync
echo "0 3 * * 1 root rsync -av /mnt/nfs_share/ /mnt/backup/ " | sudo tee -a /etc/crontab > /dev/null
```
This lets the usb disk running all the time. and i could not switch it off because of the limited usb scic driver.

The second approch is to have a service that activated the backup script, every time the disk is plugged in.
```bash
sudo tee /usr/local/bin/backup_rsync.sh > /dev/null <<EOF
#!/bin/bash
rsync -av  /mnt/nfs_share/ /mnt/backup/
umount /mnt/backup
EOF

sudo chmod +x /usr/local/bin/backup_rsync.sh
```
Add backup device to fstab
```bash
DEVICE=/dev/sdb1

# Ensure mount point exists
mkdir -p  /mnt/backup

UUID=$(blkid -s UUID -o value "$DEVICE")
FSTAB_ENTRY="UUID=$UUID /mnt/backup auto defaults,nofail 0 2"
# Check if it's already in /etc/fstab
if ! grep -q "$UUID" /etc/fstab; then
    echo "$FSTAB_ENTRY" | sudo tee -a /etc/fstab
else
    echo "Entry already exists in /etc/fstab. Skipping."
fi
sudo mount -a
```

Now add the systemd servie, that is called when the drive is mounted.
```
sudo tee /etc/systemd/system/auto-usb-backup.service > /dev/null <<EOF

[Unit]
Description=My flashdrive script trigger
Requires=mnt-backup.mount
After=mnt-backup.mount

[Service]
ExecStart=/usr/local/bin/backup_rsync.sh 

[Install]
WantedBy=mnt-backup.mount
EOF

sudo systemctl start auto-usb-backup.service
sudo systemctl enable auto-usb-backup.service
```


# install node exporter
get me an older version 1.7 vs 1.9 but it comes with all the dependencies to access the hardware and with a service that is started by default.

apt-get -y install prometheus-node-exporter
