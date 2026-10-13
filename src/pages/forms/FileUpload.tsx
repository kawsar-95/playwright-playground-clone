import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Code, Lesson, PageHeader } from "../../components";

const IMAGE_TYPES = ["image/png", "image/jpeg"];
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_FILES = 5;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Photo {
  name: string;
  url: string;
  size: number;
}

interface UploadResult {
  ok: boolean;
  text: string;
}

export default function FileUpload() {
  const [selectedName, setSelectedName] = useState("");

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const chooser = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo.url);
    },
    [photo],
  );

  const onPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhoto(null);
    setPhotoError(null);
    if (file) {
      if (!IMAGE_TYPES.includes(file.type)) setPhotoError(`${file.name} is not a PNG or JPEG image.`);
      else if (file.size > MAX_IMAGE_BYTES) setPhotoError(`${file.name} is ${formatSize(file.size)}. The limit is 1 MB.`);
      else setPhoto({ name: file.name, url: URL.createObjectURL(file), size: file.size });
      event.target.value = "";
    }
  };

  const addFiles = (incoming: File[]) => {
    setResult(null);
    const known = new Set(files.map((file) => file.name));
    const merged = [...files, ...incoming.filter((file) => !known.has(file.name))];
    if (merged.length > MAX_FILES) {
      setFilesError(`You can attach up to ${MAX_FILES} files.`);
      setFiles(merged.slice(0, MAX_FILES));
    } else {
      setFilesError(null);
      setFiles(merged);
    }
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    addFiles([...event.dataTransfer.files]);
  };

  const upload = async () => {
    const body = new FormData();
    files.forEach((file) => body.append("files", file));
    setUploading(true);
    setResult(null);
    try {
      const response = await fetch("/api/upload", { method: "POST", body });
      const data: { files: unknown[]; totalBytes: number; error?: string } = await response.json();
      if (response.ok) {
        const count = data.files.length;
        setResult({ ok: true, text: `Uploaded ${count} ${count === 1 ? "file" : "files"} (${data.totalBytes.toLocaleString("en-US")} bytes)` });
        setFiles([]);
      } else {
        setResult({ ok: false, text: `Upload failed: ${data.error}` });
      }
    } catch {
      setResult({ ok: false, text: "Upload failed: network error" });
    } finally {
      setUploading(false);
    }
  };

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <>
      <PageHeader title="File Upload">
        A plain file input, an image with rules, and attachments added by a button or by dropping them, then sent to the server.
      </PageHeader>

      <Lesson title="Uploading files">
        <h3>setInputFiles(): no dialog</h3>
        <p>Playwright puts files straight into a file input. The file can be on disk. You can also make it in the test from a buffer.</p>
        <Code>{`
await page.getByLabel('Choose file').setInputFiles('fixtures/report.pdf');

await page.getByLabel('Profile photo').setInputFiles({
  name: 'avatar.png',
  mimeType: 'image/png',
  buffer: Buffer.alloc(2 * 1024 * 1024),   // 2 MB of zeros: too large
});
`}</Code>
        <div className="lesson-callout">
          <code>accept="image/png"</code> only filters the files in the dialog of the operating system. <code>setInputFiles()</code> ignores it, and so
          can any user. The page must check the file itself. Test that it does.
        </div>
        <h3>A button instead of an input</h3>
        <p>Many sites hide the input behind a styled button. Find the hidden input with a CSS locator. Or click the button and catch the file chooser.</p>
        <Code>{`
const chooserPromise = page.waitForEvent('filechooser');
await page.getByRole('button', { name: 'Add files' }).click();
const chooser = await chooserPromise;
await chooser.setFiles([fileA, fileB]);
`}</Code>
        <h3>Dropping files</h3>
        <p>
          A drop zone reads files from a <code>drop</code> event. Build a <code>DataTransfer</code> in the page. Then dispatch the event with it.
        </p>
        <Code>{`
const dataTransfer = await page.evaluateHandle(() => {
  const transfer = new DataTransfer();
  transfer.items.add(new File(['hello'], 'hello.txt', { type: 'text/plain' }));
  return transfer;
});
await page.getByText('Drop files here').dispatchEvent('drop', { dataTransfer });
`}</Code>
        <h3>Check what reached the server</h3>
        <p>Wait for the response of the upload and read what the server reports. Or inspect the request that the page sent.</p>
      </Lesson>

      <div className="test-card">
        <h2>Upload a File</h2>
        <div className="form-group">
          <label htmlFor="file-upload">Choose file</label>
          <input id="file-upload" name="file" type="file" onChange={(event) => setSelectedName(event.target.files?.[0]?.name ?? "")} />
        </div>
        {selectedName && (
          <div className="result" data-testid="uploaded-file">
            Selected file: {selectedName}
          </div>
        )}
      </div>

      <div className="test-card">
        <h2>Profile photo</h2>
        <p>PNG or JPEG, up to 1 MB.</p>
        <div className="form-group">
          <label htmlFor="profile-photo">Profile photo</label>
          <input id="profile-photo" type="file" accept="image/png,image/jpeg" onChange={onPhoto} />
        </div>
        {photoError && (
          <p className="result error" role="alert">
            {photoError}
          </p>
        )}
        {photo && (
          <div className="photo-preview">
            <img src={photo.url} alt={`Preview of ${photo.name}`} />
            <div>
              <p>
                {photo.name} · {formatSize(photo.size)}
              </p>
              <button type="button" className="secondary" onClick={() => setPhoto(null)}>
                Remove photo
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="test-card">
        <h2>Attachments</h2>
        <p>Up to {MAX_FILES} files, 2 MB in total.</p>
        <input
          ref={chooser}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            addFiles([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
        <div
          className={dragging ? "drop-zone is-over" : "drop-zone"}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <p>Drop files here</p>
          <button type="button" className="secondary" onClick={() => chooser.current?.click()}>
            Add files
          </button>
        </div>
        {filesError && (
          <p className="result error" role="alert">
            {filesError}
          </p>
        )}
        {files.length > 0 && (
          <>
            <ul className="attachment-list" aria-label="Attachments">
              {files.map((file) => (
                <li key={file.name} className="file-row">
                  <span>
                    {file.name} <span className="muted">{formatSize(file.size)}</span>
                  </span>
                  <button
                    type="button"
                    className="danger secondary"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => {
                      setFiles((current) => current.filter((item) => item !== file));
                      setFilesError(null);
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <p data-testid="attachment-summary">
              {files.length} {files.length === 1 ? "file" : "files"} · {formatSize(totalBytes)}
            </p>
            <button type="button" onClick={upload} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </>
        )}
        {result && (
          <p className={result.ok ? "result success" : "result error"} role={result.ok ? "status" : "alert"}>
            {result.text}
          </p>
        )}
      </div>
    </>
  );
}
