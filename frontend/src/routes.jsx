import React from "react";

// Auth Imports
import SignIn from "./views/auth/SignIn";
import Welcome from "./views/dashboard/Welcome.jsx";
import DashIcon from "./components/icons/DashIcon";
import Infodata from "./data/Infodata.js";
import dashboardw from "./assets/img/logo/deshboardwhite.png";
import ClientMaster from "./views/pages/ClientMaster";
import APIMaster from "./views/pages/APIMaster";

const routes = [
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    component: <SignIn />,
  },
  {
    name: "Dashboard",
    layout: "/dashboard",
    path: "welcome",
    component: <Welcome />,
  },
  {
    name: "Client Master",
    layout: "/admin",
    path: "client-master",
    component: <ClientMaster />,
    icon: { iconlight: Infodata.dashboardw, bgcoloer: "bg-green-700" },

  },
  
  {
    name: "API Master",
    layout: "/admin",
    path: "api-master",
    component: <APIMaster />,
    icon: { iconlight: Infodata.dashboardw, bgcoloer: "bg-red-600" },

  }

];

export default routes;