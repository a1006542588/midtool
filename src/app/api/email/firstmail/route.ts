import { NextResponse } from "next/server";
import imap from "imap-simple";
import { simpleParser } from "mailparser";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const config = {
      imap: {
        user: email,
        password: password,
        host: "imap.firstmail.ltd",
        port: 993,
        tls: true,
        authTimeout: 15000,
        tlsOptions: { rejectUnauthorized: false },
      },
    };

    const connection = await imap.connect(config);
    await connection.openBox("INBOX");

    const searchCriteria = ["ALL"];
    const fetchOptions = {
      bodies: [""],
      markSeen: false,
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    const emailList = await Promise.all(
      messages.map(async (item) => {
        const all = item.parts.find((part) => part.which === "");
        const id = item.attributes.uid;
        
        if (all && all.body) {
            try {
                const parsed = await simpleParser(all.body);
                return {
                    id: id,
                    subject: parsed.subject,
                    from: parsed.from?.text,
                    to: Array.isArray(parsed.to) ? parsed.to.map(t => t.text).join(", ") : parsed.to?.text,
                    date: parsed.date,
                    text: parsed.text,
                    html: parsed.html,
                    textAsHtml: parsed.textAsHtml
                };
            } catch (e) {
                console.error("Parse error for msg", id, e);
                return {
                    id: id,
                    subject: "Error parsing message",
                    from: "Unknown",
                    date: new Date(),
                    text: "Could not parse message body."
                };
            }
        }
        return null;
      })
    );

    connection.end();

    return NextResponse.json({ 
        success: true, 
        emails: emailList.filter(Boolean).reverse() 
    });

  } catch (error: any) {
    console.error("IMAP Error:", error);
    let errorMessage = error.message || "Failed to connect or fetch emails";
    
    if (errorMessage.includes("AUTHENTICATIONFAILED")) {
        errorMessage = "Authentication failed. Please check email and password.";
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
