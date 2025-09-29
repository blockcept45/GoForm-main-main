import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function UploadPage() {
  const { data: session } = useSession();
  const [file, setFile] = useState(null);
  const [script, setScript] = useState("");
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    "/images/image1.png",
     "/images/image2.png",
     "/images/image3.png",
      "/images/image4.png",
       "/images/image5.png",
        "/images/image6.png",
        "/images/mid.png",
         "/images/image7.png",
          "/images/image8.png",
           "/images/image9.png",
  ];

  if (!session) {
    return (
      <div style={styles.centered}>
        <button style={styles.button} onClick={() => signIn("google")}>
          Sign in with Google
        </button>
      </div>
    );
  }

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

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  return (
    <div style={styles.dashboard}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>My Dashboard</h2>
        <nav>
          <ul style={styles.navList}>
            <li>Upload</li>
            <li>History</li>
            <li>Settings</li>
          </ul>
        </nav>
      </aside>

      {/* Main Area */}
      <div style={styles.main}>
        {/* Header */}
        <header style={styles.header}>
          <span>Welcome, {session.user.name}</span>
          <button style={styles.signOut} onClick={signOut}>
            Sign out
          </button>
        </header>

        {/* Upload Section */}
        <section style={styles.content}>
          <h2>Upload .txt File</h2>
          <input
            type="file"
            accept=".txt"
            onChange={(e) => setFile(e.target.files[0])}
            style={styles.inputFile}
          />
          <button style={styles.button} onClick={handleUpload}>
            Upload and Generate Script
          </button>

          {/* Output Script */}
         {script && (
  <div style={styles.outputContainer}>
    <h3>Copy & Paste this script into Google Apps Script:</h3>
    <button style={styles.copyButton} onClick={() => navigator.clipboard.writeText(script)}>
      Copy Code
    </button>
    <pre style={styles.outputScript}>{script}</pre>
  </div>
)}


          {/* Image Slider */}
          <div style={styles.sliderContainer}>
            <h3>Instruction Images</h3>
            <img
              src={images[currentImage]}
              alt={`image ${currentImage + 1}`}
              style={styles.sliderImage}
            />
            <div style={styles.sliderButtons}>
              <button onClick={prevImage} style={styles.button}>
                Previous
              </button>
              <button onClick={nextImage} style={styles.button}>
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  dashboard: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f5f7fa",
  },
  sidebar: {
    width: "240px",
    backgroundColor: "#1f2937",
    color: "#fff",
    padding: "1rem",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "2rem",
  },
  navList: {
    listStyle: "none",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: "1rem 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e5e7eb",
  },
  signOut: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    cursor: "pointer",
  },
  content: {
    padding: "2rem",
  },
  inputFile: {
    display: "block",
    marginTop: "1rem",
    marginBottom: "1rem",
  },
  button: {
    padding: "0.6rem 1.2rem",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "1rem",
  },
  outputContainer: {
    marginTop: "2rem",
    backgroundColor: "#f0f0f0",
    padding: "1rem",
    borderRadius: "8px",
  },
  outputScript: {
    whiteSpace: "pre-wrap",
    backgroundColor: "#e5e7eb",
    padding: "1rem",
    borderRadius: "6px",
    marginTop: "0.5rem",
  },
  centered: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    backgroundColor: "#f9fafb",
  },
  sliderContainer: {
    marginTop: "3rem",
    textAlign: "center",
  },
  sliderImage: {
    width: "500px",
    height: "300px",
    objectFit: "cover",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  sliderButtons: {
    marginTop: "1rem",
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
};
