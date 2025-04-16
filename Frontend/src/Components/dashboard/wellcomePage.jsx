import CryptoJS from "crypto-js";
import AdminMainPage from "./dashboardChart/AdminMainPage";
import ReceptionMainPage from "./dashboardChart/ReceptionMainPage";
import PrinterMainPage from "./dashboardChart/PrinterMainPage";
import SuperDesignerMainPage from "./dashboardChart/SuperDesignerMainPage";
import DesignerMainPage from "./dashboardChart/DesignerMainPage";
import DeliverMainPage from "./dashboardChart/DeliverMainPage";

const AdminDashboard = () => {
  const secretKey = "TET4-1"; // Use a strong secret key
  const decryptData = (hashedData) => {
    if (!hashedData) {
      console.error("No data to decrypt");
      return null;
    }
    try {
      const bytes = CryptoJS.AES.decrypt(hashedData, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      return null;
    }
  };
  const role = decryptData(localStorage.getItem("role"));
  return (
    <div className="p-6 bg-gray-100 h-screen">
      {role == "0" && <AdminMainPage />}
      {role == "1" && <DesignerMainPage />}
      {role == "2" && <ReceptionMainPage />}
      {role == "3" && <SuperDesignerMainPage />}
      {role == "4" && <PrinterMainPage />}
      {role == "5" && <DeliverMainPage />}
    </div>
  );
};

export default AdminDashboard;
