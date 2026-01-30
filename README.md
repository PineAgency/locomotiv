# Locomotiv 🚗💨

**Locomotiv** is a modern Next.js application designed to help users find detailed vehicle specifications and plan road trips with precision. By combining real-time vehicle data with smart trip analysis, it answers the critical question: *"Is this car suitable for my journey?"*

## ✨ Key Features

-   **Vehicle Research Engine**: Instantly access specifications for thousands of cars (Year, Make, Model) using NHTSA and CarQuery APIs.
-   **Smart Trip Planner**:
    -   Calculate fuel costs based on real-world efficiency and fuel prices.
    -   Analyze trip suitability (Can the car make it on one tank? How many stops are needed?).
    -   Visual "Suitability Badge" indicating if a car is safe for a specific trip.
-   **Interactive Maps**: Integrated Google Maps for selecting origin/destination and visualizing routes.
-   **Live Journey Mode**: Real-time tracking of speed, remaining distance, and ETA during a trip.
-   **Responsive Design**: Built with a "mobile-first" mindset, featuring a beautiful UI with smooth gradients and animations.

## 🛠️ Technology Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Maps**: Google Maps JavaScript API via `@react-google-maps/api`
-   **Data Sources**:
    -   [NHTSA API](https://vpic.nhtsa.dot.gov/api/) (Makes & Models)
    -   [CarQuery API](https://www.carqueryapi.com/) (Detailed Specs)

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+ installed on your machine.
-   A Google Maps API Key (optional but recommended for full map functionality).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/PineAgency/locomotiv.git
    cd locomotiv
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and add your Google Maps API key:
    ```env
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
    ```
    > **Note:** Without an API key, the map components may show an error, but other features will work.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

-   `app/page.tsx`: The main application logic, state management, and UI layout.
-   `app/components/`: Reusable UI components.
    -   `MapPanel.tsx`: Handles Google Maps rendering and interactions.
    -   `Features.tsx`: Landing page feature highlights.
    -   `JourneyModal.tsx`: The full-screen overlay for Live Journey mode.
-   `app/api/`: Server-side proxy routes for external APIs to avoid CORS issues.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
