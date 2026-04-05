import { BrowserRouter, Routes, Route } from "react-router-dom";
import GlobalStyle from "./styles.js";
import GridOverlay from "./components/GridOverlay.jsx";
import CmsLayout from "./layouts/CmsLayout.jsx";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import CreateSlashChannel from "./pages/CreateSlashChannel/CreateSlashChannel.jsx";
import CreateProjectChannel from "./pages/CreateProjectChannel/CreateProjectChannel.jsx";
import EditOurPractice from "./pages/EditOurPractice/EditOurPractice.jsx";
import ReorderCurrent from "./pages/ReorderCurrent/ReorderCurrent.jsx";
import EditCurrentLayout from "./pages/EditCurrentLayout/EditCurrentLayout.jsx";
import ManageProjects from "./pages/ManageProjects/ManageProjects.jsx";

function App() {
  return (
    <>
      <GlobalStyle />
      {import.meta.env.DEV && <GridOverlay />}
      <BrowserRouter>
        <Routes>
          <Route element={<CmsLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="current/new" element={<CreateSlashChannel />} />
            <Route path="current/reorder" element={<ReorderCurrent />} />
            <Route path="current/layout" element={<EditCurrentLayout />} />
            <Route path="project/manage" element={<ManageProjects />} />
            <Route
              path="project/new"
              element={<CreateProjectChannel />}
            />
            <Route
              path="our-practice/edit"
              element={<EditOurPractice />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
