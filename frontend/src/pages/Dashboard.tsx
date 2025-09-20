import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to overview page
    navigate("/overview");
  }, [navigate]);

  return null;
}