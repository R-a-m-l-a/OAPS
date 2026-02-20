import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 gap-6">
      
      <h1 className="text-3xl text-black font-bold">
        Online Assessment Proctoring System
      </h1>

      <Link
        href="/interviewee"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg"
      >
        Enter as Interviewee
      </Link>

      <Link
        href="/interviewer"
        className="bg-green-600 text-white px-6 py-3 rounded-lg"
      >
        Enter as Interviewer
      </Link>

    </div>
  );
}
