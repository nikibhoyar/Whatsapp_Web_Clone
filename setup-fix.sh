#!/bin/bash

echo "========================================"
echo "Fixing WhatsApp Web Clone Setup"
echo "========================================"
echo

echo "Creating Next.js project structure..."

echo "Creating app directory..."
mkdir -p app

echo "Creating components directory..."
mkdir -p components/ui

echo "Creating lib directory..."
mkdir -p lib

echo "Creating hooks directory..."
mkdir -p hooks

echo "Creating scripts directory..."
mkdir -p scripts

echo "Installing dependencies..."
npm install

echo
echo "✅ Project structure created!"
echo
echo "Now you can run:"
echo "npx shadcn@latest init"
echo
echo "Then continue with the setup..."
