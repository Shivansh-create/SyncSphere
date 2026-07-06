import nodemailer from 'nodemailer';

const otpStore = new Map();
let usersDB = [];
let nextUserId = 1;

export const login = async (req, res) => {
  const { email, name, image } = req.body;

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60000; // 5 minutes
    otpStore.set(email, { otp, expires, data: { name, image } });
    
    // Original Nodemailer Logic
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"SyncSphere Security" <security@syncsphere.app>`,
      to: email,
      subject: "SyncSphere Login OTP",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h2>SyncSphere Authentication</h2>
          <p>Here is your secure verification code:</p>
          <h1 style="color: red; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[OTP GENERATED] Click here to view OTP Email: ${previewUrl}`);

    return res.status(200).json({ otpSent: true, message: "OTP sent to email", previewUrl });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || "Unknown";

  try {
    const record = otpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    otpStore.delete(email);

    let user = usersDB.find(u => u.email === email);
    if (!user) {
      user = {
        _id: `user-${nextUserId++}`,
        email, 
        name: record.data.name || email.split('@')[0], 
        image: record.data.image || "https://github.com/shadcn.png?height=32&width=32",
        joinedOn: new Date().toISOString(),
        fingerprints: [{ ip, userAgent, lastLogin: new Date() }]
      };
      usersDB.push(user);
      return res.status(201).json({ result: user, token: `mock-token-${user._id}` });
    } else {
      user.fingerprints.push({ ip, userAgent, lastLogin: new Date() });
      return res.status(200).json({ result: user, token: `mock-token-${user._id}` });
    }
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description, plan } = req.body;
  
  const user = usersDB.find(u => u._id === _id);
  if (!user) return res.status(404).json({ message: "User unavailable..." });

  if (channelname !== undefined) user.channelname = channelname;
  if (description !== undefined) user.description = description;
  if (plan !== undefined) user.plan = plan;

  return res.status(200).json(user);
};

export const getallusers = async (req, res) => {
  return res.status(200).json(usersDB);
};
