import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LatestBlocks.module.css";

import { differenceInMinutes, parseISO } from "date-fns";

interface Block {
  height: number;
  blockHash: string;
  blockSize: number;
  blockWeight: number;
  blockVersion: number;
  blockStrippedSize: number;
  difficulty: number;
  transactionCount: number;
  timestamp: { time: string };
  timeAgo?: string; // Add this line to include the 'time ago' property
}

const LatestBlocks: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTimeAgo = (timestamp: string): string => {
    // Format the timestamp to comply with ISO 8601
    const formattedTimestamp = timestamp.replace(" ", "T") + "Z";
    const blockDate = parseISO(formattedTimestamp);
    const now = new Date();
    const minutesDiff = differenceInMinutes(now, blockDate);

    if (minutesDiff < 1) {
      return "just now";
    } else if (minutesDiff === 1) {
      return "1 minute ago";
    } else {
      return `${minutesDiff} minutes ago`;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = JSON.stringify({
        query: `query($network: BitcoinNetwork!, $limit: Int!, $timeFormat: String!) {
          bitcoin(network: $network) {
            blocks(options: {limit: $limit, desc: "height"}) {
              height
              blockHash
              blockSize
              blockWeight
              difficulty
              transactionCount
              timestamp {
                time(format: $timeFormat)
              }
            }
          }
        }`,
        variables: {
          network: "bitcoin",
          limit: 40,
          timeFormat: "%Y-%m-%d %H:%M:%S",
        },
      });

      const config = {
        method: "post",
        url: "https://graphql.bitquery.io",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": "BQYGmiOv1uJ8fPYOqDm9A38cbeMzFXmb",
          Authorization:
            "Bearer ory_at_RWxa8kkbA7x2QJHCjCr5ioimJvdr08rvZO0r8VdS6OE.Mk8ag6Gn3rT7lq24_HmLIVym1o3TUnajZE1hI4NACHw",
        },
        data: data,
      };

      try {
        const response = await axios.request(config);
        const newBlocks = response.data.data.bitcoin.blocks.map(
          (block: any) => ({
            ...block,
            timeAgo: calculateTimeAgo(block.timestamp.time),
          })
        );

        // Update the state only if there are changes
        if (JSON.stringify(newBlocks) !== JSON.stringify(blocks)) {
          setBlocks(newBlocks);
        }
        setError(null);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 6000); // Refresh every minute

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  if (isLoading) {
    return <div>Loading latest blocks...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="table-container">
      <h1>Latest Bitcoin Blocks</h1>
      <table>
        <thead>
          <tr>
            <th>Height</th>
            <th>Hash</th>
            <th>Size</th>
            <th>Weight</th>
            <th>Difficulty</th>
            <th>Transactions</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block, index) => (
            <tr key={index}>
              <td>{block.height}</td>
              <td>{block.blockHash}</td>
              <td>{block.blockSize}</td>
              <td>{block.blockWeight}</td>
              <td>{block.difficulty}</td>
              <td>{block.transactionCount}</td>
              <td>{block.timeAgo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LatestBlocks;
