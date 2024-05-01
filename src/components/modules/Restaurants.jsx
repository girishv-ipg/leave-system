import React from 'react'
import Title from '../common/Title'
import CommonTable from '../common/Table';

const Restarants = () => {

  const cols = [
    {
      title: "Sl No.",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Name",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Rating",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Description",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Location",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Belongs to",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },

    {
      title: "Status",
      render: (rowData) => {
        return <span>dummy_value</span>;
      },
    },
  ]

  return (
    <div>
      <div className='bg-[#f2f2f2] rounded-lg p-4 w-full'>
        <Title heading="List of Restarants" />

        <div className='my-5'>
          <CommonTable cols={cols} data={[1, 1, 1, 1]} />
        </div>

      </div>
    </div>
  )
}

export default Restarants