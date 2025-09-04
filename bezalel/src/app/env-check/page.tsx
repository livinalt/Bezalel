export default function EnvCheck() {
    return (
        <div>
            <h1>Environment Variables</h1>
            <p>DAYDREAM_API_TOKEN: {process.env.NEXT_PUBLIC_DAYDREAM_API_TOKEN || "Not loaded"}</p>
            <p>SIGNALING_URL: {process.env.NEXT_PUBLIC_SIGNALING_URL || "Not loaded"}</p>
        </div>
    );
}