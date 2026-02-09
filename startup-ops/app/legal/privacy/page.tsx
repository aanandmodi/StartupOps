export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-gray-300 p-8 md:p-12">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="border-b border-white/10 pb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
                    <p className="text-gray-400">Last updated: January 28, 2026</p>
                </div>

                <article className="prose prose-invert prose-emerald max-w-none">
                    <h3>1. Information We Collect</h3>
                    <p>We collect information you provide directly to us, such as your name, email address, and startup ideas/data input into our tools.</p>

                    <h3>2. How We Use Your Information</h3>
                    <p>We use your information to provide, maintain, and improve our services, including generating startup artifacts (docs, code, plans) via our AI models.</p>

                    <h3>3. Data Sharing</h3>
                    <p>We do not sell your personal data. We share data only with:</p>
                    <ul>
                        <li><strong>AI Providers (Groq):</strong> To generate content (data is processed but not used for training by default).</li>
                        <li><strong>Service Providers:</strong> For hosting (Firebase) and analytics.</li>
                    </ul>

                    <h3>4. Data Security</h3>
                    <p>We implement appropriate technical measures to protect your personal information against unauthorized access or destruction.</p>

                    <h3>5. Your Rights</h3>
                    <p>You have the right to access, correct, or delete your personal information. Contact us to exercise these rights.</p>

                    <h3>6. Changes to Policy</h3>
                    <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
                </article>

                <div className="pt-8 border-t border-white/10">
                    <a href="/settings" className="text-emerald-400 hover:text-emerald-300 transition-colors">← Back to Settings</a>
                </div>
            </div>
        </div>
    );
}
