import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // 👈 सुनिश्चित करें कि यह फाइल यहाँ इम्पोर्टेड है
import App from "./App";

import { Provider } from "react-redux";
import { store, persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      {/* Tailwind CSS और Dark Mode के सही रेंडरिंग के लिए 
        App component को यहाँ रेंडर किया जा रहा है 
      */}
      <App />
    </PersistGate>
  </Provider>
);