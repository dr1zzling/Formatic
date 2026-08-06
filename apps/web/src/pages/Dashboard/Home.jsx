import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Decode token untuk mendapatkan username (optional)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsername(payload.username || "User");
    } catch (error) {
      console.error("Invalid token");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-6">
              
      

        

        <div className="space-y-4">
          

          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md"
          >
            Logout
          </button>
        </div>
     
    </div>
  );
}
