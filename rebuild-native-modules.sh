#!/bin/bash
# Script to rebuild native modules for Node.js v22 on Raspberry Pi
echo "Rebuilding native modules for Node.js v22..."

# Remove node_modules directory
echo "Removing existing node_modules..."
rm -rf node_modules

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Install node-gyp globally if not already installed
echo "Ensuring node-gyp is installed..."
npm install -g node-gyp

# Install dependencies with force rebuild
echo "Reinstalling dependencies with force rebuild..."
npm install --build-from-source

# Rebuild specific problematic modules
echo "Rebuilding ioctl module..."
cd node_modules/ioctl
node-gyp rebuild
cd ../..

echo "Rebuilding sense-hat-led module..."
cd node_modules/sense-hat-led
node-gyp rebuild
cd ../..

echo "Native module rebuild complete. Try running your application now."
