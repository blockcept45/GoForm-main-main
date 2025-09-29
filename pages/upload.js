import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [script, setScript] = useState("");
  const { data: session } = useSession();

  if (!session)
    return <button onClick={() => signIn("google")}>Sign in with Google</button>;

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setScript(data.script);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Welcome, {session.user.name}</h2>
      <button onClick={() => signOut()}>Sign out</button>
      <br /><br />

      <input type="file" accept=".txt" onChange={(e) => setFile(e.target.files[0])} />
      <br /><br />
      <button onClick={handleUpload}>Upload and Generate Script</button>

      {script && (
        <div style={{ marginTop: 20 }}>
          <h3>Copy & Paste this script into Google Apps Script:</h3>
          <pre style={{ background: '#eee', padding: 10, whiteSpace: 'pre-wrap' }}>
            {script}
          </pre>
        </div>
      )}
    </div>
  );
}
