#!/bin/bash

# Image Optimization Script for Photo Gallery
# This script will optimize all images in the gallery folder

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Photo Gallery Image Optimization${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed.${NC}"
    echo "Please install it first:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Check if jpegoptim is installed (optional but recommended)
if ! command -v jpegoptim &> /dev/null; then
    echo -e "${RED}Warning: jpegoptim is not installed (optional but recommended).${NC}"
    echo "For better optimization, install it:"
    echo "  macOS: brew install jpegoptim"
    echo "  Ubuntu/Debian: sudo apt-get install jpegoptim"
    echo ""
    USE_JPEGOPTIM=false
else
    USE_JPEGOPTIM=true
fi

# Directory containing the images
SOURCE_DIR="public/images/gallery"
BACKUP_DIR="public/images/gallery_originals"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${GREEN}Creating backup directory: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
fi

# Image settings
MAX_WIDTH=2000        # Maximum width in pixels
MAX_HEIGHT=2000       # Maximum height in pixels
QUALITY=85            # JPEG quality (1-100, 85 is a good balance)

echo -e "${BLUE}Settings:${NC}"
echo "  Max dimensions: ${MAX_WIDTH}x${MAX_HEIGHT}px"
echo "  JPEG quality: ${QUALITY}%"
echo "  Source directory: $SOURCE_DIR"
echo "  Backup directory: $BACKUP_DIR"
echo ""

# Count files
total_files=$(find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | wc -l)
echo -e "${GREEN}Found $total_files image(s) to optimize${NC}\n"

# Initialize counters
processed=0
total_original_size=0
total_optimized_size=0

# Process each image
for img in "$SOURCE_DIR"/*.{jpg,jpeg,JPG,JPEG,png,PNG}; do
    # Skip if file doesn't exist (glob didn't match)
    [ -e "$img" ] || continue

    filename=$(basename "$img")
    backup_path="$BACKUP_DIR/$filename"

    # Get original file size
    original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
    original_size_mb=$(echo "scale=2; $original_size / 1048576" | bc)
    total_original_size=$((total_original_size + original_size))

    echo -e "${BLUE}Processing: $filename${NC} (${original_size_mb}MB)"

    # Backup original if not already backed up
    if [ ! -f "$backup_path" ]; then
        cp "$img" "$backup_path"
        echo "  ✓ Backed up to $BACKUP_DIR"
    fi

    # Optimize the image
    # 1. Resize if larger than max dimensions
    # 2. Strip metadata
    # 3. Set quality
    # 4. Progressive JPEG encoding
    convert "$img" \
        -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" \
        -strip \
        -quality $QUALITY \
        -interlace Plane \
        "$img"

    # Further optimize with jpegoptim if available
    if [ "$USE_JPEGOPTIM" = true ] && [[ "$filename" =~ \.(jpg|jpeg|JPG|JPEG)$ ]]; then
        jpegoptim --max=$QUALITY --strip-all "$img" > /dev/null 2>&1
    fi

    # Get optimized file size
    optimized_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
    optimized_size_mb=$(echo "scale=2; $optimized_size / 1048576" | bc)
    total_optimized_size=$((total_optimized_size + optimized_size))

    # Calculate savings
    savings=$((original_size - optimized_size))
    savings_percent=$(echo "scale=1; ($savings * 100) / $original_size" | bc)

    echo -e "  ${GREEN}✓ Optimized: ${optimized_size_mb}MB (saved ${savings_percent}%)${NC}\n"

    processed=$((processed + 1))
done

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}Optimization Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Files processed: $processed"
echo ""

# Calculate total savings
total_original_mb=$(echo "scale=2; $total_original_size / 1048576" | bc)
total_optimized_mb=$(echo "scale=2; $total_optimized_size / 1048576" | bc)
total_savings=$((total_original_size - total_optimized_size))
total_savings_mb=$(echo "scale=2; $total_savings / 1048576" | bc)
total_savings_percent=$(echo "scale=1; ($total_savings * 100) / $total_original_size" | bc)

echo "Original total size:   ${total_original_mb}MB"
echo "Optimized total size:  ${total_optimized_mb}MB"
echo -e "${GREEN}Total savings:         ${total_savings_mb}MB (${total_savings_percent}%)${NC}"
echo ""
echo -e "${BLUE}Original images backed up to: $BACKUP_DIR${NC}"
echo ""
echo -e "${GREEN}Your gallery should now load much faster!${NC}"
