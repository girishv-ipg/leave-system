import React from 'react'
import Title from '../common/Title'
import CommonTable from '../common/Table';

const Orders = () => {

  const cols = [
    {
      title: "Sl No.",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Restaurant Name",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Order Placed at",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Payment",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Order Status",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Actions",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },
  ]

  return (
    <div>
      <div className='bg-[#f2f2f2] rounded-lg p-4 w-full'>
        <Title heading="List of Orders" />

        <div className='my-5'>
          <CommonTable cols={cols} data={[1, 1, 1, 1]} />
        </div>

      </div>
    </div>
  )
}

export default Orders