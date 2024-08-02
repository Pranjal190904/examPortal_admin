import cors from "cors";

const corsOptions = {
  origin: [
    "https://yadavrahul818980.github.io"
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

const handleCors = cors(corsOptions);

export default handleCors;
