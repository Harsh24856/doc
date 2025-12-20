import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api.js";

export default function GetVerified() {
  const [licensePdf, setLicensePdf] = useState(null);
  const [idPdf, setIdPdf] = useState(null);
  const [registrationCouncil, setRegistrationCouncil] = useState("");

  /* =========================
     UPLOAD FILES
     ========================= */
  const uploadFiles = async () => {
    console.log("[GetVerified] Uploading files");

    const formData = new FormData();
    formData.append("license", licensePdf);
    formData.append("id", idPdf);

    const res = await fetch(
      `${API_BASE_URL}/verification/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      }
    );

    const data = await res.json();
    console.log("[GetVerified] Upload response:", data);

    if (!res.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return data;
  };

  /* =========================
     SUBMIT VERIFICATION
     ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const upload = await uploadFiles();

      const res = await fetch(
        `${API_BASE_URL}/verification/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...upload,
            registration_council: registrationCouncil,
          }),
        }
      );

      const data = await res.json();
      console.log("[GetVerified] Submit response:", data);

      if (!res.ok) {
        throw new Error(data.error);
      }

      alert("Verification submitted (Pending)");
    } catch (err) {
      console.error("[GetVerified] Error:", err.message);
      alert(err.message);
    }
  };

  return (
    <div className="page">
      <div className="card wide">
        <h2 className="title">Get Verified</h2>

        <form onSubmit={handleSubmit}>
          <label>Medical License (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setLicensePdf(e.target.files[0])}
          />

          <label className="mt-4">ID Proof (PDF)</label>
          <input
            type="file"
            accept="application/pdf"
            required
            onChange={(e) => setIdPdf(e.target.files[0])}
          />

          <input
            className="input mt-4"
            placeholder="Registration Council"
            required
            onChange={(e) =>
              setRegistrationCouncil(e.target.value)
            }
          />

          <button className="btn mt-4">
            Submit for Verification
          </button>
        </form>
      </div>
    </div>
  );
}