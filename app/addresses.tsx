import * as React from "react";
import { Alert, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useAuth } from "~/lib/contexts/AuthContext";
import {
  useCustomer,
  useCustomerAddressCreate,
  useCustomerAddressDelete,
  useCustomerAddressUpdate,
  useCustomerDefaultAddressUpdate,
} from "~/lib/shopify/hooks";

type AddressFormState = {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string;
};

const emptyForm: AddressFormState = {
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  province: "",
  country: "US",
  zip: "",
  phone: "",
};

export default function AddressesScreen() {
  const { accessToken } = useAuth();
  const { data: customer, isLoading } = useCustomer(accessToken);
  const addressCreate = useCustomerAddressCreate();
  const addressUpdate = useCustomerAddressUpdate();
  const addressDelete = useCustomerAddressDelete();
  const defaultAddressUpdate = useCustomerDefaultAddressUpdate();

  const [isEditing, setIsEditing] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<AddressFormState>(emptyForm);

  const addresses = customer?.addresses.edges.map((edge) => edge.node) || [];
  const defaultAddressId = customer?.defaultAddress?.id ?? null;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEdit = (address: (typeof addresses)[number]) => {
    setForm({
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      address1: address.address1 || "",
      address2: address.address2 || "",
      city: address.city || "",
      province: address.province || "",
      country: address.country || "US",
      zip: address.zip || "",
      phone: address.phone || "",
    });
    setEditingId(address.id);
    setIsEditing(true);
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      Alert.alert("Login required", "Please log in to manage your addresses.");
      return;
    }
    if (!form.address1 || !form.city || !form.province || !form.country || !form.zip) {
      Alert.alert("Missing info", "Please complete all required fields.");
      return;
    }
    try {
      if (editingId) {
        await addressUpdate.mutateAsync({
          accessToken,
          addressId: editingId,
          address: {
            firstName: form.firstName || undefined,
            lastName: form.lastName || undefined,
            address1: form.address1,
            address2: form.address2 || undefined,
            city: form.city,
            province: form.province || undefined,
            country: form.country,
            zip: form.zip,
            phone: form.phone || undefined,
          },
        });
      } else {
        await addressCreate.mutateAsync({
          accessToken,
          address: {
            firstName: form.firstName || undefined,
            lastName: form.lastName || undefined,
            address1: form.address1,
            address2: form.address2 || undefined,
            city: form.city,
            province: form.province || undefined,
            country: form.country,
            zip: form.zip,
            phone: form.phone || undefined,
          },
        });
      }
      resetForm();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save address");
    }
  };

  const handleDelete = async (addressId: string) => {
    if (!accessToken) return;
    Alert.alert("Delete address", "Are you sure you want to delete this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await addressDelete.mutateAsync({ accessToken, addressId });
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to delete address",
            );
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (addressId: string) => {
    if (!accessToken) return;
    try {
      await defaultAddressUpdate.mutateAsync({ accessToken, addressId });
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update default");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <Stack.Screen options={{ title: "Addresses", headerBackTitle: "Back" }} />
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-h2 mb-4 font-bold text-foreground">Saved Addresses</Text>

        {!accessToken ? (
          <View className="rounded-2xl bg-card p-4">
            <Text className="text-sm text-muted-foreground">Log in to manage saved addresses.</Text>
          </View>
        ) : isLoading ? (
          <View className="rounded-2xl bg-card p-4">
            <Text className="text-sm text-muted-foreground">Loading addresses…</Text>
          </View>
        ) : (
          <>
            {addresses.length === 0 ? (
              <View className="rounded-2xl bg-card p-4 mb-6">
                <Text className="text-sm text-muted-foreground">
                  No saved addresses yet. Add one below.
                </Text>
              </View>
            ) : (
              <View className="mb-6">
                {addresses.map((address) => {
                  const isDefault = address.id === defaultAddressId;
                  return (
                    <View key={address.id} className="mb-3 rounded-2xl bg-card p-4">
                      <Text className="text-base font-semibold text-foreground">
                        {address.firstName} {address.lastName}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {address.address1}
                        {address.address2 ? `, ${address.address2}` : ""}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {address.city}, {address.province} {address.zip}
                      </Text>
                      <Text className="text-sm text-muted-foreground">{address.country}</Text>
                      {address.phone ? (
                        <Text className="text-sm text-muted-foreground">{address.phone}</Text>
                      ) : null}
                      <View className="mt-3 flex-row flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onPress={() => handleEdit(address)}>
                          <Text>Edit</Text>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onPress={() => handleDelete(address.id)}
                        >
                          <Text>Delete</Text>
                        </Button>
                        <Button
                          size="sm"
                          variant={isDefault ? "default" : "secondary"}
                          onPress={() => handleSetDefault(address.id)}
                        >
                          <Text>{isDefault ? "Default" : "Set Default"}</Text>
                        </Button>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View className="rounded-2xl bg-card p-4">
              <Text className="mb-4 text-lg font-semibold text-foreground">
                {isEditing ? "Edit Address" : "Add Address"}
              </Text>
              <View className="mb-3">
                <Label>First name</Label>
                <Input
                  value={form.firstName}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, firstName: value }))}
                />
              </View>
              <View className="mb-3">
                <Label>Last name</Label>
                <Input
                  value={form.lastName}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, lastName: value }))}
                />
              </View>
              <View className="mb-3">
                <Label>Address</Label>
                <Input
                  value={form.address1}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, address1: value }))}
                />
              </View>
              <View className="mb-3">
                <Label>Apartment, suite, etc.</Label>
                <Input
                  value={form.address2}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, address2: value }))}
                />
              </View>
              <View className="mb-3">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, city: value }))}
                />
              </View>
              <View className="mb-3">
                <Label>State</Label>
                <Input
                  value={form.province}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, province: value }))}
                />
              </View>
              <View className="mb-3">
                <Label>ZIP</Label>
                <Input
                  value={form.zip}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, zip: value }))}
                />
              </View>
              <View className="mb-3">
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, country: value }))}
                />
              </View>
              <View className="mb-4">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                />
              </View>
              <View className="flex-row gap-2">
                <Button onPress={handleSubmit} className="flex-1">
                  <Text>{isEditing ? "Save Address" : "Add Address"}</Text>
                </Button>
                {isEditing ? (
                  <Button variant="outline" onPress={resetForm} className="flex-1">
                    <Text>Cancel</Text>
                  </Button>
                ) : null}
              </View>
            </View>
          </>
        )}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
