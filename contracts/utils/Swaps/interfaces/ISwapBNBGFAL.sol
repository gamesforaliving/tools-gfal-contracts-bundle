// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface ISwapBNBGFAL {
    function swapBNBforGFAL(
        uint256 amountOutMin
    ) external payable returns (uint amountOut);

    function swapGFALforBNB(
        uint256 amountGFAL,
        uint256 amountOutMin
    ) external returns (uint amountOut);
}
