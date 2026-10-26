
import io
from pathlib import Path

import fitz
from PIL import Image, ImageFilter

# Folder containing your certificate PDFs
CERT_DIR = Path("assets/documents/certificates")

# Signature area as proportions of page width and height.
# Adjust these values if your certificate layout differs.
X1, Y1 = 0.08, 0.68
X2, Y2 = 0.43, 0.85

# Render resolution and blur strength
SCALE = 2
BLUR_RADIUS = 18

def blur_signature(image):
    width, height = image.size

    # Convert proportional coordinates to image pixels
    left = int(width * X1)
    top = int(height * Y1)
    right = int(width * X2)
    bottom = int(height * Y2)

    # Blur only the selected rectangular area
    region = image.crop((left, top, right, bottom))
    region = region.filter(
        ImageFilter.GaussianBlur(radius=BLUR_RADIUS)
    )
    image.paste(region, (left, top))

    return image

def process_pdf(input_path):
    output_path = input_path.with_name(
        input_path.stem + "-blurred.pdf"
    )

    try:
        source = fitz.open(input_path)
        output = fitz.open()

        for page in source:
            pix = page.get_pixmap(
                matrix=fitz.Matrix(SCALE, SCALE),
                alpha=False
            )
            image = Image.open(
                io.BytesIO(pix.tobytes("png"))
            ).convert("RGB")

            blur_signature(image)

            buffer = io.BytesIO()
            image.save(buffer, format="PNG")

            # Create an image-only page to prevent the original
            # signature text/image from remaining underneath.
            new_page = output.new_page(
                width=page.rect.width,
                height=page.rect.height
            )
            new_page.insert_image(
                new_page.rect,
                stream=buffer.getvalue()
            )

        output.save(output_path, garbage=4, deflate=True)
        output.close()
        source.close()

        print(f"Created: {output_path}")

    except Exception as error:
        print(f"ERROR: {input_path.name}: {error}")

def main():
    if not CERT_DIR.is_dir():
        print(f"Folder not found: {CERT_DIR}")
        return

    pdf_files = [
        path for path in CERT_DIR.glob("*.pdf")
        if not path.stem.endswith("-blurred")
        and "OJT_Documents" not in path.name
    ]

    if not pdf_files:
        print("No certificate PDFs found.")
        return

    for pdf in pdf_files:
        process_pdf(pdf)

    print("Finished processing certificates.")

if __name__ == "__main__":
    main()
