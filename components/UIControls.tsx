
import React from 'react';

interface UIControlsProps {
  destinations: string[];
  selectedDestination: string;
  onDestinationChange: (destination: string) => void;
  onStart: () => void;
  onStop: () => void;
  onRecalibrate: () => void;
  onExitAR: () => void;
  isNavigating: boolean;
}

const UIControls: React.FC<UIControlsProps> = ({
  destinations,
  selectedDestination,
  onDestinationChange,
  onStart,
  onStop,
  onRecalibrate,
  onExitAR,
  isNavigating,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto text-white">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-grow w-full">
            <label htmlFor="destination-select" className="block text-sm font-medium mb-1">
              Choose Destination
            </label>
            <select
              id="destination-select"
              value={selectedDestination}
              onChange={(e) => onDestinationChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isNavigating}
            >
              <option value="">Select a room...</option>
              {destinations.map((dest) => (
                <option key={dest} value={dest}>
                  {dest.replace('\n', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isNavigating ? (
              <button
                onClick={onStart}
                disabled={!selectedDestination}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed transition"
              >
                Start
              </button>
            ) : (
              <button
                onClick={onStop}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition"
              >
                Stop
              </button>
            )}
            <button
              onClick={onRecalibrate}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition"
              title="Aligns the virtual map with your current position and heading. Stand at the entrance and face forward before pressing."
            >
              Recalibrate
            </button>
            <button
              onClick={onExitAR}
              className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition"
            >
              Exit AR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIControls;
