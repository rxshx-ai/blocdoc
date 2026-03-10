// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HealthcareLogistics is AccessControl, ReentrancyGuard {
    bytes32 public constant SHIPMENT_MANAGER_ROLE = keccak256("SHIPMENT_MANAGER_ROLE");
    bytes32 public constant PROVIDER_ROLE = keccak256("PROVIDER_ROLE");
    bytes32 public constant TELEMETRY_ROLE = keccak256("TELEMETRY_ROLE");

    enum ShipmentStatus {
        CREATED,
        BIDDING,
        PROVIDER_SELECTED,
        IN_TRANSIT,
        DELIVERED
    }

    struct Shipment {
        string shipment_id;
        string pickup_location;
        string delivery_location;
        string cargo_type;
        int256 temperature_requirement;
        ShipmentStatus status;
        address selected_provider;
        uint256 escrow_amount;
        bool payment_released;
        bool exists;
    }

    struct ProviderBid {
        address provider_address;
        uint256 price;
        uint256 estimated_delivery_time;
        string vehicle_type;
    }

    mapping(bytes32 => Shipment) private shipments;
    mapping(bytes32 => ProviderBid[]) private bidsByShipment;

    event ShipmentCreated(
        string indexed shipmentId,
        string pickupLocation,
        string deliveryLocation,
        string cargoType,
        int256 temperatureRequirement,
        uint256 escrowAmount
    );
    event ShipmentStatusUpdated(string indexed shipmentId, ShipmentStatus status);
    event BidSubmitted(
        string indexed shipmentId,
        address indexed providerAddress,
        uint256 price,
        uint256 estimatedDeliveryTime,
        string vehicleType
    );
    event ProviderSelected(string indexed shipmentId, address indexed providerAddress);
    event PickupVerified(string indexed shipmentId, address indexed providerAddress);
    event DeliveryConfirmed(string indexed shipmentId, address indexed providerAddress);
    event TelemetryHashLogged(string indexed shipmentId, string telemetryHash, uint256 timestamp);
    event PaymentReleased(string indexed shipmentId, address indexed providerAddress, uint256 amount);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SHIPMENT_MANAGER_ROLE, msg.sender);
        _grantRole(TELEMETRY_ROLE, msg.sender);
    }

    function createShipment(
        string calldata shipmentId,
        string calldata pickupLocation,
        string calldata deliveryLocation,
        string calldata cargoType,
        int256 temperatureRequirement
    ) external payable onlyRole(SHIPMENT_MANAGER_ROLE) {
        bytes32 key = _shipmentKey(shipmentId);
        require(!shipments[key].exists, "Shipment already exists");

        shipments[key] = Shipment({
            shipment_id: shipmentId,
            pickup_location: pickupLocation,
            delivery_location: deliveryLocation,
            cargo_type: cargoType,
            temperature_requirement: temperatureRequirement,
            status: ShipmentStatus.CREATED,
            selected_provider: address(0),
            escrow_amount: msg.value,
            payment_released: false,
            exists: true
        });

        emit ShipmentCreated(
            shipmentId,
            pickupLocation,
            deliveryLocation,
            cargoType,
            temperatureRequirement,
            msg.value
        );
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.CREATED);
    }

    function submitBid(
        string calldata shipmentId,
        uint256 price,
        uint256 estimatedDeliveryTime,
        string calldata vehicleType
    ) external onlyRole(PROVIDER_ROLE) {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = _getExistingShipment(key);

        require(
            shipment.status == ShipmentStatus.CREATED || shipment.status == ShipmentStatus.BIDDING,
            "Shipment not open for bids"
        );

        bidsByShipment[key].push(
            ProviderBid({
                provider_address: msg.sender,
                price: price,
                estimated_delivery_time: estimatedDeliveryTime,
                vehicle_type: vehicleType
            })
        );

        if (shipment.status == ShipmentStatus.CREATED) {
            shipment.status = ShipmentStatus.BIDDING;
            emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.BIDDING);
        }

        emit BidSubmitted(shipmentId, msg.sender, price, estimatedDeliveryTime, vehicleType);
    }

    function selectProvider(
        string calldata shipmentId,
        address providerAddress
    ) external onlyRole(SHIPMENT_MANAGER_ROLE) {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = _getExistingShipment(key);

        require(
            shipment.status == ShipmentStatus.CREATED || shipment.status == ShipmentStatus.BIDDING,
            "Cannot select provider in current status"
        );
        require(_hasBidFromProvider(key, providerAddress), "Provider has no bid");

        shipment.selected_provider = providerAddress;
        shipment.status = ShipmentStatus.PROVIDER_SELECTED;

        emit ProviderSelected(shipmentId, providerAddress);
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.PROVIDER_SELECTED);
    }

    function verifyPickup(string calldata shipmentId) external onlyRole(PROVIDER_ROLE) {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = _getExistingShipment(key);

        require(shipment.status == ShipmentStatus.PROVIDER_SELECTED, "Invalid shipment status");
        require(shipment.selected_provider == msg.sender, "Only selected provider can verify pickup");

        shipment.status = ShipmentStatus.IN_TRANSIT;

        emit PickupVerified(shipmentId, msg.sender);
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.IN_TRANSIT);
    }

    function confirmDelivery(string calldata shipmentId) external onlyRole(SHIPMENT_MANAGER_ROLE) {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = _getExistingShipment(key);

        require(shipment.status == ShipmentStatus.IN_TRANSIT, "Shipment is not in transit");

        shipment.status = ShipmentStatus.DELIVERED;

        emit DeliveryConfirmed(shipmentId, shipment.selected_provider);
        emit ShipmentStatusUpdated(shipmentId, ShipmentStatus.DELIVERED);
    }

    function logTelemetryHash(
        string calldata shipmentId,
        string calldata telemetryHash
    ) external onlyRole(TELEMETRY_ROLE) {
        bytes32 key = _shipmentKey(shipmentId);
        _getExistingShipment(key);

        emit TelemetryHashLogged(shipmentId, telemetryHash, block.timestamp);
    }

    function releasePayment(string calldata shipmentId)
        external
        nonReentrant
        onlyRole(SHIPMENT_MANAGER_ROLE)
    {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = _getExistingShipment(key);

        require(shipment.status == ShipmentStatus.DELIVERED, "Shipment not delivered");
        require(!shipment.payment_released, "Payment already released");
        require(shipment.selected_provider != address(0), "Provider not selected");
        require(shipment.escrow_amount > 0, "No escrow balance");

        shipment.payment_released = true;
        uint256 paymentAmount = shipment.escrow_amount;
        shipment.escrow_amount = 0;

        (bool success, ) = shipment.selected_provider.call{value: paymentAmount}("");
        require(success, "Payment transfer failed");

        emit PaymentReleased(shipmentId, shipment.selected_provider, paymentAmount);
    }

    function getShipment(
        string calldata shipmentId
    )
        external
        view
        returns (
            string memory shipment_id,
            string memory pickup_location,
            string memory delivery_location,
            string memory cargo_type,
            int256 temperature_requirement,
            ShipmentStatus status,
            address selected_provider,
            uint256 escrow_amount,
            bool payment_released
        )
    {
        bytes32 key = _shipmentKey(shipmentId);
        Shipment storage shipment = _getExistingShipment(key);

        return (
            shipment.shipment_id,
            shipment.pickup_location,
            shipment.delivery_location,
            shipment.cargo_type,
            shipment.temperature_requirement,
            shipment.status,
            shipment.selected_provider,
            shipment.escrow_amount,
            shipment.payment_released
        );
    }

    function getBids(string calldata shipmentId) external view returns (ProviderBid[] memory) {
        bytes32 key = _shipmentKey(shipmentId);
        _getExistingShipment(key);
        return bidsByShipment[key];
    }

    function _shipmentKey(string calldata shipmentId) private pure returns (bytes32) {
        return keccak256(bytes(shipmentId));
    }

    function _getExistingShipment(bytes32 key) private view returns (Shipment storage shipment) {
        shipment = shipments[key];
        require(shipment.exists, "Shipment does not exist");
    }

    function _hasBidFromProvider(bytes32 key, address providerAddress) private view returns (bool) {
        ProviderBid[] storage bidList = bidsByShipment[key];
        for (uint256 i = 0; i < bidList.length; i++) {
            if (bidList[i].provider_address == providerAddress) {
                return true;
            }
        }
        return false;
    }
}
