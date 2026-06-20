import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

interface ChartData {
  type: 'bar' | 'line' | 'pie';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string;
    }[];
  };
}

interface ContentItem {
  type: 'text' | 'table' | 'list' | 'chart' | 'collapsible';
  title?: string;
  content?: string;
  data?: TableData | string[] | ChartData;
  children?: ContentItem[];
  expanded?: boolean;
}

interface ContentRendererProps {
  items: ContentItem[];
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ items }) => {
  const [expandedItems, setExpandedItems] = React.useState<Set<number>>(new Set());

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const renderItem = (item: ContentItem, index: number) => {
    switch (item.type) {
      case 'text':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-4"
          >
            {item.title && <h3 className="text-lg font-semibold mb-2">{item.title}</h3>}
            <p className="text-gray-700 dark:text-gray-300">{item.content}</p>
          </motion.div>
        );

      case 'list':
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-4"
          >
            {item.title && <h3 className="text-lg font-semibold mb-2">{item.title}</h3>}
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
              {Array.isArray(item.data) && item.data.map((listItem, listIndex) => (
                <li key={listIndex}>{listItem}</li>
              ))}
            </ul>
          </motion.div>
        );

      case 'table':
        const tableData = item.data as TableData;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-4"
          >
            {item.title && <h3 className="text-lg font-semibold mb-2">{item.title}</h3>}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      {tableData.headers.map((header, headerIndex) => (
                        <th
                          key={headerIndex}
                          className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        );

      case 'collapsible':
        const isExpanded = expandedItems.has(index);
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="mb-4"
          >
            <Card>
              <Button
                onClick={() => toggleExpanded(index)}
                variant="ghost"
                className="w-full justify-between p-0"
              >
                <span className="text-lg font-semibold">{item.title}</span>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.span>
              </Button>
              
              <motion.div
                initial={false}
                animate={{
                  height: isExpanded ? 'auto' : 0,
                  opacity: isExpanded ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  {item.children && <ContentRenderer items={item.children} />}
                </div>
              </motion.div>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {items.map((item, index) => renderItem(item, index))}
    </div>
  );
};