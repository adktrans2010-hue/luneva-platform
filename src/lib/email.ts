import { connect, type Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";

type SendMailOptions = {
  to: string;
  subject: string;
  text: string;
};

type MailSocket = Socket | TLSSocket;

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST?.trim() ?? "",
    port: Number(process.env.SMTP_PORT ?? 465),
    user: process.env.SMTP_USER?.trim() ?? "",
    password: process.env.SMTP_PASSWORD?.trim() ?? "",
    from:
      process.env.SMTP_FROM?.trim() ||
      process.env.SMTP_USER?.trim() ||
      "no-reply@luneva-psy.ru",
    secure: String(process.env.SMTP_SECURE ?? "true") !== "false",
  };
}

function readResponse(socket: MailSocket) {
  return new Promise<string>((resolve, reject) => {
    let buffer = "";

    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines.at(-1) ?? "";

      if (/^\d{3} /.test(lastLine)) {
        cleanup();
        resolve(buffer);
      }
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function command(socket: MailSocket, value: string, allowData = false) {
  socket.write(`${value}\r\n`);
  const response = await readResponse(socket);

  if (!/^[23]/.test(response) && !(allowData && /^354/.test(response))) {
    throw new Error(`SMTP error: ${response.trim()}`);
  }

  return response;
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function escapeEmailBody(value: string) {
  return value.replace(/^\./gm, "..");
}

export function isEmailConfigured() {
  const config = getSmtpConfig();

  return Boolean(config.host && config.user && config.password);
}

export async function sendMail({ to, subject, text }: SendMailOptions) {
  const config = getSmtpConfig();

  if (!isEmailConfigured()) {
    throw new Error(
      "Email is not configured: add SMTP_HOST, SMTP_USER and SMTP_PASSWORD."
    );
  }

  const socket = config.secure
    ? tlsConnect({ host: config.host, port: config.port, servername: config.host })
    : connect({ host: config.host, port: config.port });

  try {
    await readResponse(socket);
    await command(socket, `EHLO ${config.host}`);
    await command(socket, "AUTH LOGIN");
    await command(socket, Buffer.from(config.user).toString("base64"));
    await command(socket, Buffer.from(config.password).toString("base64"));
    await command(socket, `MAIL FROM:<${config.from}>`);
    await command(socket, `RCPT TO:<${to}>`);
    await command(socket, "DATA", true);

    const message = [
      `From: ${encodeHeader("Luneva Psy")} <${config.from}>`,
      `To: <${to}>`,
      `Subject: ${encodeHeader(subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      escapeEmailBody(text),
      ".",
    ].join("\r\n");

    socket.write(`${message}\r\n`);
    const response = await readResponse(socket);

    if (!/^[23]/.test(response)) {
      throw new Error(`SMTP error: ${response.trim()}`);
    }

    await command(socket, "QUIT");
  } finally {
    socket.end();
  }
}
