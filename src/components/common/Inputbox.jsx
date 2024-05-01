import React from "react";

const InputBox = ({ errormsg, label, name, value, type, onChange, styles }) => {
  return (
    <div className="relative  w-full">
      <input
        type={type ?? "text"}
        name={name}
        value={value}
        className={`${errormsg ? "border-red-500" : "border-gray-400"
          } peer border    p-4 text-gray-900 placeholder-transparent   focus:outline-none ${styles}`}
        onChange={onChange}
        errormsg={errormsg}
        id={name}
        placeholder={label}
      />
      <label
        for={name}
        className={`body3 peer-focus:body3 peer-placeholder-shown:body3 absolute -top-3.5 left-2 bg-white px-2 text-sm text-DimGray transition-all peer-placeholder-shown:top-4  peer-placeholder-shown:text-base ${errormsg
          ? "peer-placeholder-shown:text-red-500 peer-focus:text-red-500"
          : "peer-placeholder-shown:text-DimGray peer-focus:text-DimGray"
          } peer-focus:-top-3.5 peer-focus:bg-white  `}
      >
        {label}
      </label>
      {errormsg ? (
        <p className="ml-4 text-xs text-red-500">{errormsg}</p>
      ) : null}
    </div>
  );
};

export default InputBox;