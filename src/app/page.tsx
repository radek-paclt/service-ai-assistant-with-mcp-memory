export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">AI Service Assistant</h1>
        <p className="text-lg text-gray-600 mb-8">
          Moderní aplikace pro servisní podporu s AI asistencí
        </p>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-700">
              Aplikace se inicializuje...
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}